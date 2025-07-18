/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { DAPP_URL, WINDOW_TITLES } from '../../../helpers';
import { Mockttp } from '../../../mock-e2e';
import { Anvil } from '../../../seeder/anvil';
import SetApprovalForAllTransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/set-approval-for-all-transaction-confirmation';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import TestDapp from '../../../page-objects/pages/test-dapp';
import ContractAddressRegistry from '../../../seeder/contract-address-registry';
import { Driver } from '../../../webdriver/driver';
import { withTransactionEnvelopeTypeFixtures } from '../helpers';
import { TestSuiteArguments, mocked4BytesSetApprovalForAll } from './shared';

const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

describe('Confirmation Redesign ERC721 setApprovalForAll', function () {
  describe('Submit a transaction', function () {
    it('Sends a type 0 transaction (Legacy)', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.legacy,
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          await createTransactionAssertDetailsAndConfirm(
            driver,
            contractRegistry,
            localNodes?.[0],
          );
        },
        mocks,
        SMART_CONTRACTS.NFTS,
      );
    });

    it('Sends a type 2 transaction (EIP1559)', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.feeMarket,
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          await createTransactionAssertDetailsAndConfirm(
            driver,
            contractRegistry,
            localNodes?.[0],
          );
        },
        mocks,
        SMART_CONTRACTS.NFTS,
      );
    });
  });
});

async function mocks(server: Mockttp) {
  return [await mocked4BytesSetApprovalForAll(server)];
}

async function createTransactionAssertDetailsAndConfirm(
  driver: Driver,
  contractRegistry?: ContractAddressRegistry,
  localNode?: Anvil,
) {
  await loginWithBalanceValidation(driver, localNode);

  const contractAddress = await (
    contractRegistry as ContractAddressRegistry
  ).getContractAddress(SMART_CONTRACTS.NFTS);

  const testDapp = new TestDapp(driver);

  await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });
  await testDapp.clickERC721SetApprovalForAllButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const setApprovalForAllConfirmation =
    new SetApprovalForAllTransactionConfirmation(driver);

  await setApprovalForAllConfirmation.check_setApprovalForAllTitle();
  await setApprovalForAllConfirmation.check_setApprovalForAllSubHeading();

  await setApprovalForAllConfirmation.clickScrollToBottomButton();
  await setApprovalForAllConfirmation.clickFooterConfirmButton();
}
