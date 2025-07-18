import { AllProperties } from '../../../shared/modules/object.utils';

// This describes the subset of background controller state attached to errors
// sent to Sentry These properties have some potential to be useful for
// debugging, and they do not contain any identifiable information.
export const SENTRY_BACKGROUND_STATE = {
  AccountTreeController: {
    accountTree: false,
  },
  AccountsController: {
    internalAccounts: {
      accounts: false,
      selectedAccount: false,
    },
  },
  AccountTracker: {
    accounts: false,
    accountsByChainId: false,
    currentBlockGasLimit: true,
    currentBlockGasLimitByChainId: true,
  },
  AddressBookController: {
    addressBook: false,
  },
  AlertController: {
    alertEnabledness: true,
    unconnectedAccountAlertShownOrigins: false,
    web3ShimUsageOrigins: false,
  },
  AnnouncementController: {
    announcements: false,
  },
  AuthenticationController: {
    isSignedIn: false,
    srpSessionData: false,
  },
  NetworkOrderController: {
    orderedNetworkList: [],
    enabledNetworkMap: {},
  },
  AccountOrderController: {
    pinnedAccountList: [],
    hiddenAccountList: [],
  },
  AppMetadataController: {
    currentAppVersion: true,
    currentMigrationVersion: true,
    previousAppVersion: true,
    previousMigrationVersion: true,
  },
  ApprovalController: {
    approvalFlows: false,
    pendingApprovals: false,
    pendingApprovalCount: false,
  },
  AppStateController: {
    browserEnvironment: true,
    connectedStatusPopoverHasBeenShown: true,
    currentPopupId: false,
    onboardingDate: false,
    currentExtensionPopupId: false,
    defaultHomeActiveTabName: true,
    enableEnforcedSimulations: true,
    enableEnforcedSimulationsForTransactions: false,
    fullScreenGasPollTokens: true,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    hadAdvancedGasFeesSetPriorToMigration92_3: true,
    isRampCardClosed: true,
    nftsDetectionNoticeDismissed: true,
    nftsDropdownState: true,
    notificationGasPollTokens: true,
    outdatedBrowserWarningLastShown: true,
    popupGasPollTokens: true,
    qrHardware: true,
    recoveryPhraseReminderHasBeenShown: true,
    recoveryPhraseReminderLastShown: true,
    showBetaHeader: true,
    showPermissionsTour: true,
    showNetworkBanner: true,
    showAccountBanner: true,
    showTestnetMessageInDropdown: true,
    surveyLinkLastClickedOrClosed: true,
    snapsInstallPrivacyWarningShown: true,
    termsOfUseLastAgreed: true,
    throttledOrigins: false,
    timeoutMinutes: true,
    trezorModel: true,
    isUpdateAvailable: true,
    updateModalLastDismissedAt: true,
    lastUpdatedAt: true,
  },
  MultichainBalancesController: {
    balances: false,
  },
  MultichainAssetsController: {
    accountsAssets: false,
    assetsMetadata: false,
  },
  MultichainAssetsRatesController: {
    assetsRates: false,
  },
  BridgeController: {
    assetExchangeRates: false,
    minimumBalanceForRentExemptionInLamports: false,
    quoteRequest: {
      walletAddress: false,
      srcTokenAddress: true,
      slippage: true,
      srcChainId: true,
      destChainId: true,
      destTokenAddress: true,
      srcTokenAmount: true,
    },
    quotes: [],
    quotesInitialLoadTime: true,
    quotesLastFetched: true,
    quotesLoadingStatus: true,
    quoteFetchError: true,
    quotesRefreshCount: true,
  },
  BridgeStatusController: {
    txHistory: false,
  },
  CronjobController: {
    events: false,
  },
  CurrencyController: {
    currentCurrency: true,
    currencyRates: true,
  },
  DecryptMessageController: {
    unapprovedDecryptMsgs: false,
    unapprovedDecryptMsgCount: true,
  },
  EncryptionPublicKeyController: {
    unapprovedEncryptionPublicKeyMsgs: false,
    unapprovedEncryptionPublicKeyMsgCount: true,
  },
  EnsController: {
    ensResolutionsByAddress: false,
    ensEntries: false,
  },
  GasFeeController: {
    estimatedGasFeeTimeBounds: true,
    gasEstimateType: true,
    gasFeeEstimates: true,
    gasFeeEstimatesByChainId: true,
    nonRPCGasFeeApisDisabled: false,
  },
  KeyringController: {
    isUnlocked: true,
    keyrings: false,
  },
  LoggingController: {
    logs: false,
  },
  NotificationServicesController: {
    subscriptionAccountsSeen: false,
    isMetamaskNotificationsFeatureSeen: false,
    isNotificationServicesEnabled: false,
    isFeatureAnnouncementsEnabled: false,
    metamaskNotificationsList: false,
    metamaskNotificationsReadList: false,
    isCheckingAccountsPresence: false,
    isFetchingMetamaskNotifications: false,
    isUpdatingMetamaskNotifications: false,
    isUpdatingMetamaskNotificationsAccount: false,
  },
  MetaMetricsController: {
    eventsBeforeMetricsOptIn: false,
    tracesBeforeMetricsOptIn: false,
    fragments: false,
    metaMetricsId: true,
    participateInMetaMetrics: true,
    segmentApiCalls: false,
    traits: false,
    dataCollectionForMarketing: false,
    marketingCampaignCookieId: true,
    latestNonAnonymousEventTimestamp: true,
  },
  MetaMetricsDataDeletionController: {
    metaMetricsDataDeletionId: true,
    metaMetricsDataDeletionTimestamp: true,
  },
  NameController: {
    names: false,
    nameSources: false,
    useExternalNameSources: false,
  },
  NetworkController: {
    networkConfigurations: false,
    networksMetadata: true,
    selectedNetworkClientId: false,
  },
  NftController: {
    allNftContracts: false,
    allNfts: false,
    ignoredNfts: false,
  },
  OnboardingController: {
    completedOnboarding: true,
    firstTimeFlowType: true,
    onboardingTabs: false,
    seedPhraseBackedUp: true,
  },
  PPOMController: {
    securityAlertsEnabled: false,
    storageMetadata: [],
    versionInfo: [],
  },
  PermissionController: {
    subjects: false,
  },
  PermissionLogController: {
    permissionActivityLog: false,
    permissionHistory: false,
  },
  PhishingController: {},
  PreferencesController: {
    advancedGasFee: true,
    currentLocale: true,
    dismissSeedBackUpReminder: true,
    overrideContentSecurityPolicyHeader: true,
    featureFlags: true,
    forgottenPassword: true,
    identities: false,
    isIpfsGatewayEnabled: false,
    ipfsGateway: false,
    knownMethodData: false,
    ledgerTransportType: true,
    lostIdentities: false,
    openSeaEnabled: true,
    preferences: {
      autoLockTimeLimit: true,
      hideZeroBalanceTokens: true,
      showExtensionInFullSizeView: true,
      showFiatInTestnets: true,
      showTestNetworks: true,
      smartTransactionsOptInStatus: true,
      tokenNetworkFilter: {},
      showNativeTokenAsMainBalance: true,
      showConfirmationAdvancedDetails: true,
      privacyMode: false,
    },
    useExternalServices: false,
    selectedAddress: false,
    snapRegistryList: false,
    theme: true,
    signatureSecurityAlertResponses: false,
    addressSecurityAlertResponses: false,
    use4ByteResolution: true,
    useAddressBarEnsResolution: true,
    useBlockie: true,
    useCurrencyRateCheck: true,
    useMultiAccountBalanceChecker: true,
    useNftDetection: true,
    usePhishDetect: true,
    useTokenDetection: true,
    useTransactionSimulations: true,
    enableMV3TimestampSave: true,
  },
  RemoteFeatureFlagController: {
    remoteFeatureFlags: true,
    cacheTimestamp: false,
  },
  NotificationServicesPushController: {
    fcmToken: false,
  },
  MultichainRatesController: {
    fiatCurrency: true,
    rates: true,
    cryptocurrencies: true,
  },
  SelectedNetworkController: { domains: false },
  SignatureController: {
    unapprovedPersonalMsgCount: true,
    unapprovedPersonalMsgs: false,
    unapprovedTypedMessages: false,
    unapprovedTypedMessagesCount: true,
  },
  SmartTransactionsController: {
    smartTransactionsState: {
      fees: {
        approvalTxFees: true,
        tradeTxFees: true,
      },
      liveness: true,
      smartTransactions: false,
      userOptIn: true,
      userOptInV2: true,
    },
  },
  SnapController: {
    snaps: false,
  },
  SnapInterfaceController: {
    interfaces: false,
  },
  SnapInsightsController: {
    insights: false,
  },
  SnapsRegistry: {
    database: false,
    lastUpdated: false,
    databaseUnavailable: false,
  },
  SubjectMetadataController: {
    subjectMetadata: false,
  },
  SwapsController: {
    swapsState: {
      approveTxId: false,
      customApproveTxData: false,
      customGasPrice: true,
      customMaxFeePerGas: true,
      customMaxGas: true,
      customMaxPriorityFeePerGas: true,
      errorKey: true,
      fetchParams: true,
      quotes: false,
      quotesLastFetched: true,
      quotesPollingLimitEnabled: true,
      routeState: true,
      saveFetchedQuotes: true,
      selectedAggId: true,
      swapsFeatureFlags: true,
      swapsFeatureIsLive: true,
      swapsQuotePrefetchingRefreshTime: true,
      swapsQuoteRefreshTime: true,
      swapsStxBatchStatusRefreshTime: true,
      swapsStxStatusDeadline: true,
      swapsStxGetTransactionsRefreshTime: true,
      swapsStxMaxFeeMultiplier: true,
      swapsUserFeeLevel: true,
      tokens: false,
      topAggId: false,
      tradeTxId: false,
    },
  },
  TokenDetectionController: {
    [AllProperties]: false,
  },
  TokenListController: {
    preventPollingOnNetworkRestart: true,
    tokensChainsCache: {
      [AllProperties]: false,
    },
  },
  TokenBalancesController: {
    tokenBalances: false,
  },
  TokenRatesController: {
    marketData: false,
  },
  TokensController: {
    allDetectedTokens: {
      [AllProperties]: false,
    },
    allIgnoredTokens: {
      [AllProperties]: false,
    },
    allTokens: {
      [AllProperties]: false,
    },
  },
  TransactionController: {
    transactions: false,
    lastFetchedBlockNumbers: false,
    methodData: false,
  },
  TxController: {
    transactions: false,
  },
  UserOperationController: {
    userOperations: false,
  },
  UserStorageController: {
    isBackupAndSyncEnabled: true,
    isBackupAndSyncUpdateLoading: false,
    isAccountSyncingEnabled: true,
    isContactSyncingEnabled: true,
    hasAccountSyncingSyncedAtLeastOnce: false,
    isAccountSyncingReadyToBeDispatched: false,
  },
};

const flattenedBackgroundStateMask = Object.values(
  SENTRY_BACKGROUND_STATE,
).reduce((partialBackgroundState, controllerState: object) => {
  return {
    ...partialBackgroundState,
    ...controllerState,
  };
}, {});

// This describes the subset of Redux state attached to errors sent to Sentry
// These properties have some potential to be useful for debugging, and they do
// not contain any identifiable information.
export const SENTRY_UI_STATE = {
  gas: true,
  history: true,
  appState: {
    customNonceValue: true,
    isAccountMenuOpen: true,
    isNetworkMenuOpen: true,
    nextNonce: true,
    pendingTokens: false,
    welcomeScreenSeen: true,
    slides: false,
    confirmationExchangeRates: true,
  },
  metamask: {
    ...flattenedBackgroundStateMask,
    // This property comes from the background but isn't in controller state
    isInitialized: true,
    useSafeChainsListValidation: true,
    watchEthereumAccountEnabled: false,
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    addSnapAccountEnabled: false,
    snapsAddSnapAccountModalDismissed: false,
    ///: END:ONLY_INCLUDE_IF
    newPrivacyPolicyToastClickedOrClosed: false,
    newPrivacyPolicyToastShownDate: false,
  },
  unconnectedAccount: true,
};
