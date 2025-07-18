import EventEmitter from 'events';
import { Messenger } from '@metamask/base-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { BlockTracker, Provider } from '@metamask/network-controller';

import { flushPromises } from '../../../test/lib/timer-helpers';
import { createTestProviderTools } from '../../../test/stub/provider';
import type {
  AccountTrackerControllerOptions,
  AllowedActions,
  AllowedEvents,
} from './account-tracker-controller';
import AccountTrackerController, {
  getDefaultAccountTrackerControllerState,
} from './account-tracker-controller';

const noop = () => true;
const currentNetworkId = '5';
const currentChainId = '0x5';
const VALID_ADDRESS = '0x0000000000000000000000000000000000000000';
const VALID_ADDRESS_TWO = '0x0000000000000000000000000000000000000001';

const SELECTED_ADDRESS = '0x123';

const INITIAL_BALANCE_1 = '0x1';
const INITIAL_BALANCE_2 = '0x2';
const UPDATE_BALANCE = '0xabc';
const UPDATE_BALANCE_HOOK = '0xabcd';

const GAS_LIMIT = '0x111111';
const GAS_LIMIT_HOOK = '0x222222';

// The below three values were generated by running MetaMask in the browser
// The response to eth_call, which is called via `ethContract.balances`
// in `#updateAccountsViaBalanceChecker` of account-tracker-controller.ts, needs to be properly
// formatted or else ethers will throw an error.
const ETHERS_CONTRACT_BALANCES_ETH_CALL_RETURN =
  '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000038d7ea4c6800600000000000000000000000000000000000000000000000000000000000186a0';
const EXPECTED_CONTRACT_BALANCE_1 = '0x038d7ea4c68006';
const EXPECTED_CONTRACT_BALANCE_2 = '0x0186a0';

const mockAccounts = {
  [VALID_ADDRESS]: { address: VALID_ADDRESS, balance: INITIAL_BALANCE_1 },
  [VALID_ADDRESS_TWO]: {
    address: VALID_ADDRESS_TWO,
    balance: INITIAL_BALANCE_2,
  },
};

class MockBlockTracker extends EventEmitter {
  getCurrentBlock = noop;

  getLatestBlock = noop;
}

function buildMockBlockTracker({ shouldStubListeners = true } = {}) {
  const blockTrackerStub = new MockBlockTracker();
  if (shouldStubListeners) {
    jest.spyOn(blockTrackerStub, 'addListener').mockImplementation();
    jest.spyOn(blockTrackerStub, 'removeListener').mockImplementation();
  }
  return blockTrackerStub;
}

type WithControllerOptions = {
  completedOnboarding?: boolean;
  useMultiAccountBalanceChecker?: boolean;
  getNetworkClientById?: jest.Mock;
  getSelectedAccount?: jest.Mock;
} & Partial<AccountTrackerControllerOptions>;

type WithControllerCallback<ReturnValue> = ({
  controller,
  blockTrackerFromHookStub,
  blockTrackerStub,
  triggerAccountRemoved,
}: {
  controller: AccountTrackerController;
  blockTrackerFromHookStub: MockBlockTracker;
  blockTrackerStub: MockBlockTracker;
  triggerAccountRemoved: (address: string) => void;
}) => ReturnValue;

type WithControllerArgs<ReturnValue> =
  | [WithControllerCallback<ReturnValue>]
  | [WithControllerOptions, WithControllerCallback<ReturnValue>];

async function withController<ReturnValue>(
  ...args: WithControllerArgs<ReturnValue>
): Promise<ReturnValue> {
  const [{ ...rest }, fn] = args.length === 2 ? args : [{}, args[0]];
  const {
    completedOnboarding = false,
    useMultiAccountBalanceChecker = false,
    getNetworkClientById,
    getSelectedAccount,
    ...accountTrackerOptions
  } = rest;
  const { provider } = createTestProviderTools({
    scaffold: {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      eth_getBalance: UPDATE_BALANCE,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      eth_call: ETHERS_CONTRACT_BALANCES_ETH_CALL_RETURN,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      eth_getBlockByNumber: { gasLimit: GAS_LIMIT },
    },
    networkId: currentNetworkId,
    chainId: currentNetworkId,
  });
  const blockTrackerStub = buildMockBlockTracker();

  const messenger = new Messenger<AllowedActions, AllowedEvents>();
  const getSelectedAccountStub = () =>
    ({
      id: 'accountId',
      address: SELECTED_ADDRESS,
    }) as InternalAccount;
  messenger.registerActionHandler(
    'AccountsController:getSelectedAccount',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    getSelectedAccount || getSelectedAccountStub,
  );

  const { provider: providerFromHook } = createTestProviderTools({
    scaffold: {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      eth_getBalance: UPDATE_BALANCE_HOOK,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      eth_call: ETHERS_CONTRACT_BALANCES_ETH_CALL_RETURN,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      eth_getBlockByNumber: { gasLimit: GAS_LIMIT_HOOK },
    },
    networkId: 'selectedNetworkId',
    chainId: currentChainId,
  });

  const getNetworkStateStub = jest.fn().mockReturnValue({
    selectedNetworkClientId: 'selectedNetworkClientId',
  });
  messenger.registerActionHandler(
    'NetworkController:getState',
    getNetworkStateStub,
  );

  const blockTrackerFromHookStub = buildMockBlockTracker();
  const getNetworkClientByIdStub = jest.fn().mockReturnValue({
    configuration: {
      chainId: currentChainId,
    },
    blockTracker: blockTrackerFromHookStub,
    provider: providerFromHook,
  });
  messenger.registerActionHandler(
    'NetworkController:getNetworkClientById',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    getNetworkClientById || getNetworkClientByIdStub,
  );

  const getOnboardingControllerState = jest.fn().mockReturnValue({
    completedOnboarding,
  });
  messenger.registerActionHandler(
    'OnboardingController:getState',
    getOnboardingControllerState,
  );

  const getPreferencesControllerState = jest.fn().mockReturnValue({
    useMultiAccountBalanceChecker,
  });
  messenger.registerActionHandler(
    'PreferencesController:getState',
    getPreferencesControllerState,
  );

  const controller = new AccountTrackerController({
    state: getDefaultAccountTrackerControllerState(),
    provider: provider as Provider,
    blockTracker: blockTrackerStub as unknown as BlockTracker,
    getNetworkIdentifier: jest.fn(),
    messenger: messenger.getRestricted({
      name: 'AccountTrackerController',
      allowedActions: [
        'AccountsController:getSelectedAccount',
        'NetworkController:getState',
        'NetworkController:getNetworkClientById',
        'OnboardingController:getState',
        'PreferencesController:getState',
      ],
      allowedEvents: [
        'AccountsController:selectedEvmAccountChange',
        'OnboardingController:stateChange',
        'KeyringController:accountRemoved',
      ],
    }),
    ...accountTrackerOptions,
  });

  return await fn({
    controller,
    blockTrackerFromHookStub,
    blockTrackerStub,
    triggerAccountRemoved: (address: string) => {
      messenger.publish('KeyringController:accountRemoved', address);
    },
  });
}

describe('AccountTrackerController', () => {
  describe('start', () => {
    it('restarts the subscription to the block tracker and update accounts', async () => {
      await withController(({ controller, blockTrackerStub }) => {
        const updateAccountsSpy = jest
          .spyOn(controller, 'updateAccounts')
          .mockResolvedValue();

        controller.start();

        expect(blockTrackerStub.removeListener).toHaveBeenNthCalledWith(
          1,
          'latest',
          expect.any(Function),
        );
        expect(blockTrackerStub.addListener).toHaveBeenNthCalledWith(
          1,
          'latest',
          expect.any(Function),
        );
        expect(updateAccountsSpy).toHaveBeenNthCalledWith(1); // called first time with no args

        controller.start();

        expect(blockTrackerStub.removeListener).toHaveBeenNthCalledWith(
          2,
          'latest',
          expect.any(Function),
        );
        expect(blockTrackerStub.addListener).toHaveBeenNthCalledWith(
          2,
          'latest',
          expect.any(Function),
        );
        expect(updateAccountsSpy).toHaveBeenNthCalledWith(2); // called second time with no args

        controller.stop();
      });
    });
  });

  describe('stop', () => {
    it('ends the subscription to the block tracker', async () => {
      await withController(({ controller, blockTrackerStub }) => {
        controller.stop();

        expect(blockTrackerStub.removeListener).toHaveBeenNthCalledWith(
          1,
          'latest',
          expect.any(Function),
        );
      });
    });
  });

  describe('startPollingByNetworkClientId', () => {
    it('should subscribe to the block tracker and update accounts if not already using the networkClientId', async () => {
      await withController(({ controller, blockTrackerFromHookStub }) => {
        const updateAccountsSpy = jest
          .spyOn(controller, 'updateAccounts')
          .mockResolvedValue();

        controller.startPollingByNetworkClientId('mainnet');

        expect(blockTrackerFromHookStub.addListener).toHaveBeenCalledWith(
          'latest',
          expect.any(Function),
        );
        expect(updateAccountsSpy).toHaveBeenCalledWith('mainnet');

        controller.startPollingByNetworkClientId('mainnet');

        expect(blockTrackerFromHookStub.addListener).toHaveBeenCalledTimes(1);
        expect(updateAccountsSpy).toHaveBeenCalledTimes(1);

        controller.stopAllPolling();
      });
    });

    it('should subscribe to the block tracker and update accounts for each networkClientId', async () => {
      const blockTrackerFromHookStub1 = buildMockBlockTracker();
      const blockTrackerFromHookStub2 = buildMockBlockTracker();
      const blockTrackerFromHookStub3 = buildMockBlockTracker();
      await withController(
        {
          getNetworkClientById: jest
            .fn()
            .mockImplementation((networkClientId) => {
              switch (networkClientId) {
                case 'mainnet':
                  return {
                    configuration: {
                      chainId: '0x1',
                    },
                    blockTracker: blockTrackerFromHookStub1,
                  };
                case 'goerli':
                  return {
                    configuration: {
                      chainId: '0x5',
                    },
                    blockTracker: blockTrackerFromHookStub2,
                  };
                case 'networkClientId1':
                  return {
                    configuration: {
                      chainId: '0xa',
                    },
                    blockTracker: blockTrackerFromHookStub3,
                  };
                default:
                  throw new Error('unexpected networkClientId');
              }
            }),
        },
        ({ controller }) => {
          const updateAccountsSpy = jest
            .spyOn(controller, 'updateAccounts')
            .mockResolvedValue();

          controller.startPollingByNetworkClientId('mainnet');

          expect(blockTrackerFromHookStub1.addListener).toHaveBeenCalledWith(
            'latest',
            expect.any(Function),
          );
          expect(updateAccountsSpy).toHaveBeenCalledWith('mainnet');

          controller.startPollingByNetworkClientId('goerli');

          expect(blockTrackerFromHookStub2.addListener).toHaveBeenCalledWith(
            'latest',
            expect.any(Function),
          );
          expect(updateAccountsSpy).toHaveBeenCalledWith('goerli');

          controller.startPollingByNetworkClientId('networkClientId1');

          expect(blockTrackerFromHookStub3.addListener).toHaveBeenCalledWith(
            'latest',
            expect.any(Function),
          );
          expect(updateAccountsSpy).toHaveBeenCalledWith('networkClientId1');

          controller.stopAllPolling();
        },
      );
    });
  });

  describe('stopPollingByPollingToken', () => {
    it('should unsubscribe from the block tracker when called with a valid polling that was the only active pollingToken for a given networkClient', async () => {
      await withController(({ controller, blockTrackerFromHookStub }) => {
        jest.spyOn(controller, 'updateAccounts').mockResolvedValue();

        const pollingToken =
          controller.startPollingByNetworkClientId('mainnet');

        controller.stopPollingByPollingToken(pollingToken);

        expect(blockTrackerFromHookStub.removeListener).toHaveBeenCalledWith(
          'latest',
          expect.any(Function),
        );
      });
    });

    it('should gracefully handle unknown polling tokens', async () => {
      await withController(({ controller, blockTrackerFromHookStub }) => {
        jest.spyOn(controller, 'updateAccounts').mockResolvedValue();

        const pollingToken =
          controller.startPollingByNetworkClientId('mainnet');

        controller.stopPollingByPollingToken('unknown-token');
        controller.stopPollingByPollingToken(pollingToken);

        expect(blockTrackerFromHookStub.removeListener).toHaveBeenCalledWith(
          'latest',
          expect.any(Function),
        );
      });
    });

    it('should not unsubscribe from the block tracker if called with one of multiple active polling tokens for a given networkClient', async () => {
      await withController(({ controller, blockTrackerFromHookStub }) => {
        jest.spyOn(controller, 'updateAccounts').mockResolvedValue();

        const pollingToken1 =
          controller.startPollingByNetworkClientId('mainnet');
        controller.startPollingByNetworkClientId('mainnet');

        controller.stopPollingByPollingToken(pollingToken1);

        expect(blockTrackerFromHookStub.removeListener).not.toHaveBeenCalled();

        controller.stopAllPolling();
      });
    });

    it('should error if no pollingToken is passed', async () => {
      await withController(({ controller }) => {
        expect(() => {
          controller.stopPollingByPollingToken(undefined);
        }).toThrow('pollingToken required');
      });
    });
  });

  describe('stopAll', () => {
    it('should end all subscriptions', async () => {
      const blockTrackerFromHookStub1 = buildMockBlockTracker();
      const blockTrackerFromHookStub2 = buildMockBlockTracker();
      const getNetworkClientByIdStub = jest
        .fn()
        .mockImplementation((networkClientId) => {
          switch (networkClientId) {
            case 'mainnet':
              return {
                configuration: {
                  chainId: '0x1',
                },
                blockTracker: blockTrackerFromHookStub1,
              };
            case 'goerli':
              return {
                configuration: {
                  chainId: '0x5',
                },
                blockTracker: blockTrackerFromHookStub2,
              };
            default:
              throw new Error('unexpected networkClientId');
          }
        });
      await withController(
        {
          getNetworkClientById: getNetworkClientByIdStub,
        },
        ({ controller, blockTrackerStub }) => {
          jest.spyOn(controller, 'updateAccounts').mockResolvedValue();

          controller.startPollingByNetworkClientId('mainnet');

          controller.startPollingByNetworkClientId('goerli');

          controller.stopAllPolling();

          expect(blockTrackerStub.removeListener).toHaveBeenCalledWith(
            'latest',
            expect.any(Function),
          );
          expect(blockTrackerFromHookStub1.removeListener).toHaveBeenCalledWith(
            'latest',
            expect.any(Function),
          );
          expect(blockTrackerFromHookStub2.removeListener).toHaveBeenCalledWith(
            'latest',
            expect.any(Function),
          );
        },
      );
    });
  });

  describe('blockTracker "latest" events', () => {
    it('updates currentBlockGasLimit, currentBlockGasLimitByChainId, and accounts when polling is initiated via `start`', async () => {
      const blockTrackerStub = buildMockBlockTracker({
        shouldStubListeners: false,
      });
      await withController(
        {
          blockTracker: blockTrackerStub as unknown as BlockTracker,
        },
        async ({ controller }) => {
          const updateAccountsSpy = jest
            .spyOn(controller, 'updateAccounts')
            .mockResolvedValue();

          controller.start();
          blockTrackerStub.emit('latest', 'blockNumber');

          await flushPromises();

          expect(updateAccountsSpy).toHaveBeenCalledWith(undefined);

          expect(controller.state).toStrictEqual({
            accounts: {},
            accountsByChainId: {},
            currentBlockGasLimit: GAS_LIMIT,
            currentBlockGasLimitByChainId: {
              [currentChainId]: GAS_LIMIT,
            },
          });

          controller.stop();
        },
      );
    });

    it('updates only the currentBlockGasLimitByChainId and accounts when polling is initiated via `startPollingByNetworkClientId`', async () => {
      const blockTrackerFromHookStub = buildMockBlockTracker({
        shouldStubListeners: false,
      });
      const providerFromHook = createTestProviderTools({
        scaffold: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          eth_getBalance: UPDATE_BALANCE_HOOK,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          eth_call: ETHERS_CONTRACT_BALANCES_ETH_CALL_RETURN,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          eth_getBlockByNumber: { gasLimit: GAS_LIMIT_HOOK },
        },
        networkId: '0x1',
        chainId: '0x1',
      }).provider;
      const getNetworkClientByIdStub = jest
        .fn()
        .mockImplementation((networkClientId) => {
          switch (networkClientId) {
            case 'mainnet':
              return {
                configuration: {
                  chainId: '0x1',
                },
                blockTracker: blockTrackerFromHookStub,
                provider: providerFromHook,
              };
            case 'selectedNetworkClientId':
              return {
                configuration: {
                  chainId: currentChainId,
                },
              };
            default:
              throw new Error('unexpected networkClientId');
          }
        });
      await withController(
        {
          getNetworkClientById: getNetworkClientByIdStub,
        },
        async ({ controller }) => {
          const updateAccountsSpy = jest
            .spyOn(controller, 'updateAccounts')
            .mockResolvedValue();

          controller.startPollingByNetworkClientId('mainnet');

          blockTrackerFromHookStub.emit('latest', 'blockNumber');

          await flushPromises();

          expect(updateAccountsSpy).toHaveBeenCalledWith('mainnet');

          expect(controller.state).toStrictEqual({
            accounts: {},
            accountsByChainId: {},
            currentBlockGasLimit: '',
            currentBlockGasLimitByChainId: {
              '0x1': GAS_LIMIT_HOOK,
            },
          });

          controller.stopAllPolling();
        },
      );
    });
  });

  describe('updateAccountsAllActiveNetworks', () => {
    it('updates accounts for the globally selected network and all currently polling networks', async () => {
      await withController(async ({ controller }) => {
        const updateAccountsSpy = jest
          .spyOn(controller, 'updateAccounts')
          .mockResolvedValue();
        await controller.startPollingByNetworkClientId('networkClientId1');
        await controller.startPollingByNetworkClientId('networkClientId2');
        await controller.startPollingByNetworkClientId('networkClientId3');

        expect(updateAccountsSpy).toHaveBeenCalledTimes(3);

        await controller.updateAccountsAllActiveNetworks();

        expect(updateAccountsSpy).toHaveBeenCalledTimes(7);
        expect(updateAccountsSpy).toHaveBeenNthCalledWith(4); // called with no args
        expect(updateAccountsSpy).toHaveBeenNthCalledWith(
          5,
          'networkClientId1',
        );
        expect(updateAccountsSpy).toHaveBeenNthCalledWith(
          6,
          'networkClientId2',
        );
        expect(updateAccountsSpy).toHaveBeenNthCalledWith(
          7,
          'networkClientId3',
        );
      });
    });
  });

  describe('updateAccounts', () => {
    it('does not update accounts if completedOnBoarding is false', async () => {
      await withController(
        {
          completedOnboarding: false,
        },
        async ({ controller }) => {
          await controller.updateAccounts();

          expect(controller.state).toStrictEqual({
            accounts: {},
            currentBlockGasLimit: '',
            accountsByChainId: {},
            currentBlockGasLimitByChainId: {},
          });
        },
      );
    });

    describe('chain does not have single call balance address', () => {
      const mockAccountsWithSelectedAddress = {
        ...mockAccounts,
        [SELECTED_ADDRESS]: {
          address: SELECTED_ADDRESS,
          balance: '0x0',
        },
      };
      const mockInitialState = {
        accounts: mockAccountsWithSelectedAddress,
        accountsByChainId: {
          '0x999': mockAccountsWithSelectedAddress,
        },
      };

      describe('when useMultiAccountBalanceChecker is true', () => {
        it('updates all accounts directly', async () => {
          await withController(
            {
              completedOnboarding: true,
              useMultiAccountBalanceChecker: true,
              state: mockInitialState,
              getNetworkClientById: jest.fn().mockReturnValue({
                configuration: {
                  chainId: '0x999',
                },
              }),
            },
            async ({ controller }) => {
              await controller.updateAccounts();

              const accounts = {
                [VALID_ADDRESS]: {
                  address: VALID_ADDRESS,
                  balance: UPDATE_BALANCE,
                },
                [VALID_ADDRESS_TWO]: {
                  address: VALID_ADDRESS_TWO,
                  balance: UPDATE_BALANCE,
                },
                [SELECTED_ADDRESS]: {
                  address: SELECTED_ADDRESS,
                  balance: UPDATE_BALANCE,
                },
              };

              expect(controller.state).toStrictEqual({
                accounts,
                accountsByChainId: {
                  '0x999': accounts,
                },
                currentBlockGasLimit: '',
                currentBlockGasLimitByChainId: {},
              });
            },
          );
        });
      });

      describe('when useMultiAccountBalanceChecker is false', () => {
        it('updates only the selectedAddress directly, setting other balances to null', async () => {
          await withController(
            {
              completedOnboarding: true,
              useMultiAccountBalanceChecker: false,
              state: mockInitialState,
              getNetworkClientById: jest.fn().mockReturnValue({
                configuration: {
                  chainId: '0x999',
                },
              }),
            },
            async ({ controller }) => {
              await controller.updateAccounts();

              const accounts = {
                [VALID_ADDRESS]: { address: VALID_ADDRESS, balance: null },
                [VALID_ADDRESS_TWO]: {
                  address: VALID_ADDRESS_TWO,
                  balance: null,
                },
                [SELECTED_ADDRESS]: {
                  address: SELECTED_ADDRESS,
                  balance: UPDATE_BALANCE,
                },
              };

              expect(controller.state).toStrictEqual({
                accounts,
                accountsByChainId: {
                  '0x999': accounts,
                },
                currentBlockGasLimit: '',
                currentBlockGasLimitByChainId: {},
              });
            },
          );
        });
      });
    });

    describe('chain does have single call balance address and network is not localhost', () => {
      describe('when useMultiAccountBalanceChecker is true', () => {
        it('updates all accounts via balance checker', async () => {
          await withController(
            {
              completedOnboarding: true,
              useMultiAccountBalanceChecker: true,
              getNetworkIdentifier: jest
                .fn()
                .mockReturnValue('http://not-localhost:8545'),
              getSelectedAccount: jest.fn().mockReturnValue({
                id: 'accountId',
                address: VALID_ADDRESS,
              } as InternalAccount),
              state: {
                accounts: { ...mockAccounts },
                accountsByChainId: {
                  [currentChainId]: { ...mockAccounts },
                },
              },
            },
            async ({ controller }) => {
              await controller.updateAccounts('mainnet');

              const accounts = {
                [VALID_ADDRESS]: {
                  address: VALID_ADDRESS,
                  balance: EXPECTED_CONTRACT_BALANCE_1,
                },
                [VALID_ADDRESS_TWO]: {
                  address: VALID_ADDRESS_TWO,
                  balance: EXPECTED_CONTRACT_BALANCE_2,
                },
              };

              expect(controller.state).toStrictEqual({
                accounts,
                accountsByChainId: {
                  [currentChainId]: accounts,
                },
                currentBlockGasLimit: '',
                currentBlockGasLimitByChainId: {},
              });
            },
          );
        });
      });
    });
  });

  describe('updateAccountByAddress', () => {
    it('does not update account by address if completedOnboarding is false', async () => {
      await withController(
        {
          completedOnboarding: false,
        },
        async ({ controller }) => {
          const VALID_ADDRESS_TO_UPDATE = '0x1234';
          await controller.updateAccountByAddress({
            address: VALID_ADDRESS_TO_UPDATE,
          });

          expect(controller.state).toStrictEqual({
            accounts: {},
            currentBlockGasLimit: '',
            accountsByChainId: {},
            currentBlockGasLimitByChainId: {},
          });
        },
      );
    });

    it('updates an account by address if completedOnboarding is true', async () => {
      const VALID_ADDRESS_TO_UPDATE = '0x1234';
      await withController(
        {
          completedOnboarding: true,
          state: {
            accounts: {
              [VALID_ADDRESS_TO_UPDATE]: {
                address: VALID_ADDRESS_TO_UPDATE,
                balance: null,
              },
            },
          },
        },
        async ({ controller }) => {
          await controller.updateAccountByAddress({
            address: VALID_ADDRESS_TO_UPDATE,
          });

          expect(controller.state).toStrictEqual({
            accounts: {
              [VALID_ADDRESS_TO_UPDATE]: {
                address: VALID_ADDRESS_TO_UPDATE,
                balance: '0xabc',
              },
            },
            currentBlockGasLimit: '',
            accountsByChainId: {
              [currentChainId]: {
                [VALID_ADDRESS_TO_UPDATE]: {
                  address: VALID_ADDRESS_TO_UPDATE,
                  balance: '0xabc',
                },
              },
            },
            currentBlockGasLimitByChainId: {},
          });
        },
      );
    });

    it('updates an account for selected address if no address is provided', async () => {
      await withController(
        {
          completedOnboarding: true,
          state: {
            accounts: {
              [VALID_ADDRESS]: {
                address: VALID_ADDRESS,
                balance: null,
              },
            },
            accountsByChainId: {
              [currentChainId]: {
                [VALID_ADDRESS]: {
                  address: VALID_ADDRESS,
                  balance: null,
                },
              },
            },
          },
        },
        async ({ controller }) => {
          expect(controller.state).toStrictEqual({
            accounts: {
              [VALID_ADDRESS]: {
                address: VALID_ADDRESS,
                balance: null,
              },
            },
            accountsByChainId: {
              [currentChainId]: {
                [VALID_ADDRESS]: {
                  address: VALID_ADDRESS,
                  balance: null,
                },
              },
            },
            currentBlockGasLimit: '',
            currentBlockGasLimitByChainId: {},
          });
        },
      );
    });
  });

  describe('onAccountRemoved', () => {
    it('should remove an account from state', async () => {
      await withController(
        {
          state: {
            accounts: { ...mockAccounts },
            accountsByChainId: {
              [currentChainId]: {
                ...mockAccounts,
              },
              '0x1': {
                ...mockAccounts,
              },
              '0x2': {
                ...mockAccounts,
              },
            },
          },
        },
        ({ controller, triggerAccountRemoved }) => {
          triggerAccountRemoved(VALID_ADDRESS);

          const accounts = {
            [VALID_ADDRESS_TWO]: mockAccounts[VALID_ADDRESS_TWO],
          };

          expect(controller.state).toStrictEqual({
            accounts,
            accountsByChainId: {
              [currentChainId]: accounts,
              '0x1': accounts,
              '0x2': accounts,
            },
            currentBlockGasLimit: '',
            currentBlockGasLimitByChainId: {},
          });
        },
      );
    });
  });

  describe('clearAccounts', () => {
    it('should reset state', async () => {
      await withController(
        {
          state: {
            accounts: { ...mockAccounts },
            accountsByChainId: {
              [currentChainId]: {
                ...mockAccounts,
              },
              '0x1': {
                ...mockAccounts,
              },
              '0x2': {
                ...mockAccounts,
              },
            },
          },
        },
        ({ controller }) => {
          controller.clearAccounts();

          expect(controller.state).toStrictEqual({
            accounts: {},
            accountsByChainId: {
              [currentChainId]: {},
            },
            currentBlockGasLimit: '',
            currentBlockGasLimitByChainId: {},
          });
        },
      );
    });
  });
});
