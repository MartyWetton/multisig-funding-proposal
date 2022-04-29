// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { GovernanceStakingUpgrade } from "tornado-governance/contracts/v3-relayer-registry/GovernanceStakingUpgrade.sol";

contract GovernanceMock is GovernanceStakingUpgrade {
    constructor(
        address stakingRewardsAddress,
        address gasCompLogic,
        address userVaultAddress
    ) public GovernanceStakingUpgrade(stakingRewardsAddress, gasCompLogic, userVaultAddress) {}
}
