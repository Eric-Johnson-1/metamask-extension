import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import {
  getCurrentChainId,
  isNetworkLoading,
  getProviderConfig,
} from '../../../shared/modules/selectors/networks';
import {
  getAllAccountsOnNetworkAreEmpty,
  getNetworkIdentifier,
  getPreferences,
  getTheme,
  getIsTestnet,
  isCurrentProviderCustom,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getUnapprovedConfirmations,
  ///: END:ONLY_INCLUDE_IF
  getShowExtensionInFullSizeView,
  getNetworkToAutomaticallySwitchTo,
  getNumberOfAllUnapprovedTransactionsAndMessages,
  getCurrentNetwork,
  getSelectedInternalAccount,
  oldestPendingConfirmationSelector,
  getUnapprovedTransactions,
  getPendingApprovals,
  getIsMultichainAccountsState1Enabled,
} from '../../selectors';
import {
  lockMetamask,
  hideImportNftsModal,
  hideIpfsModal,
  setCurrentCurrency,
  setLastActiveTime,
  toggleAccountMenu,
  toggleNetworkMenu,
  hideImportTokensModal,
  hideDeprecatedNetworkModal,
  addPermittedAccount,
  automaticallySwitchNetwork,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  hideKeyringRemovalResultModal,
  ///: END:ONLY_INCLUDE_IF
  setEditedNetwork,
} from '../../store/actions';
import { pageChanged } from '../../ducks/history/history';
import { prepareToLeaveSwaps } from '../../ducks/swaps/swaps';
import { getSendStage } from '../../ducks/send';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../shared/constants/preferences';
import { getShouldShowSeedPhraseReminder } from '../../selectors/multi-srp/multi-srp';
import Routes from './routes.component';

function mapStateToProps(state) {
  const { activeTab, appState } = state;
  const { alertOpen, alertMessage, isLoading, loadingMessage } = appState;
  const { autoLockTimeLimit = DEFAULT_AUTO_LOCK_TIME_LIMIT, privacyMode } =
    getPreferences(state);
  const { completedOnboarding } = state.metamask;

  // If there is more than one connected account to activeTabOrigin,
  // *BUT* the current account is not one of them, show the banner
  const account = getSelectedInternalAccount(state);
  const activeTabOrigin = activeTab?.origin;
  const currentNetwork = getCurrentNetwork(state);

  const networkToAutomaticallySwitchTo =
    getNetworkToAutomaticallySwitchTo(state);

  const oldestPendingApproval = oldestPendingConfirmationSelector(state);
  const pendingApprovals = getPendingApprovals(state);
  const transactionsMetadata = getUnapprovedTransactions(state);

  const shouldShowSeedPhraseReminder =
    account && getShouldShowSeedPhraseReminder(state, account);

  return {
    alertOpen,
    alertMessage,
    account,
    activeTabOrigin,
    textDirection: state.metamask.textDirection,
    isLoading,
    loadingMessage,
    isUnlocked: getIsUnlocked(state),
    isNetworkLoading: isNetworkLoading(state),
    currentCurrency: state.metamask.currentCurrency,
    autoLockTimeLimit,
    privacyMode,
    browserEnvironmentOs: state.metamask.browserEnvironment?.os,
    browserEnvironmentContainter: state.metamask.browserEnvironment?.browser,
    providerId: getNetworkIdentifier(state),
    providerType: getProviderConfig(state).type,
    theme: getTheme(state),
    sendStage: getSendStage(state),
    allAccountsOnNetworkAreEmpty: getAllAccountsOnNetworkAreEmpty(state),
    isTestNet: getIsTestnet(state),
    showExtensionInFullSizeView: getShowExtensionInFullSizeView(state),
    currentChainId: getCurrentChainId(state),
    shouldShowSeedPhraseReminder,
    forgottenPassword: state.metamask.forgottenPassword,
    isCurrentProviderCustom: isCurrentProviderCustom(state),
    completedOnboarding,
    isAccountMenuOpen: state.appState.isAccountMenuOpen,
    isNetworkMenuOpen: state.appState.isNetworkMenuOpen,
    isImportTokensModalOpen: state.appState.importTokensModalOpen,
    isBasicConfigurationModalOpen: state.appState.showBasicFunctionalityModal,
    isDeprecatedNetworkModalOpen: state.appState.deprecatedNetworkModalOpen,
    accountDetailsAddress: state.appState.accountDetailsAddress,
    isImportNftsModalOpen: state.appState.importNftsModal.open,
    isIpfsModalOpen: state.appState.showIpfsModalOpen,
    networkToAutomaticallySwitchTo,
    currentNetwork,
    totalUnapprovedConfirmationCount:
      getNumberOfAllUnapprovedTransactionsAndMessages(state),
    currentExtensionPopupId: state.metamask.currentExtensionPopupId,
    oldestPendingApproval,
    pendingApprovals,
    transactionsMetadata,
    isMultichainAccountsState1Enabled:
      getIsMultichainAccountsState1Enabled(state),
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    isShowKeyringSnapRemovalResultModal:
      state.appState.showKeyringRemovalSnapModal,
    pendingConfirmations: getUnapprovedConfirmations(state),
    ///: END:ONLY_INCLUDE_IF
  };
}

function mapDispatchToProps(dispatch) {
  return {
    lockMetaMask: () => dispatch(lockMetamask(false)),
    setCurrentCurrencyToUSD: () => dispatch(setCurrentCurrency('usd')),
    setLastActiveTime: () => dispatch(setLastActiveTime()),
    pageChanged: (path) => dispatch(pageChanged(path)),
    prepareToLeaveSwaps: () => dispatch(prepareToLeaveSwaps()),
    toggleAccountMenu: () => dispatch(toggleAccountMenu()),
    toggleNetworkMenu: () => dispatch(toggleNetworkMenu()),
    hideImportNftsModal: () => dispatch(hideImportNftsModal()),
    hideIpfsModal: () => dispatch(hideIpfsModal()),
    hideImportTokensModal: () => dispatch(hideImportTokensModal()),
    hideDeprecatedNetworkModal: () => dispatch(hideDeprecatedNetworkModal()),
    addPermittedAccount: (activeTabOrigin, address) =>
      dispatch(addPermittedAccount(activeTabOrigin, address)),
    automaticallySwitchNetwork: (networkId) =>
      dispatch(automaticallySwitchNetwork(networkId)),
    networkMenuClose: () => {
      dispatch(toggleNetworkMenu());
      dispatch(setEditedNetwork());
    },
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    hideShowKeyringSnapRemovalResultModal: () =>
      dispatch(hideKeyringRemovalResultModal()),
    ///: END:ONLY_INCLUDE_IF
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(Routes);
