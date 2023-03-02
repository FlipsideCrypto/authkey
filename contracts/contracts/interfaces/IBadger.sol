// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.16;

/// @dev Factory output.
import {BadgerOrganization} from "../BadgerOrganization.sol";

/// @dev Core dependencies.
import {IBadgerOrganizationStruct} from "./IBadgerOrganizationStruct.sol";

interface IBadger is IBadgerOrganizationStruct {
    ////////////////////////////////////////////////////////
    ///                     EVENTS                       ///
    ////////////////////////////////////////////////////////

    /// @dev Announce when a new organization has been deployed.
    event OrganizationCreated(
        BadgerOrganization indexed organization,
        address indexed owner,
        uint256 indexed organizationId
    );

    ////////////////////////////////////////////////////////
    ///                     SETTERS                      ///
    ////////////////////////////////////////////////////////

    /**
     * @dev Deploy a new Badger Organization based on the provided `_organization`.
     * @param _organization The Organization struct containing the details of the new Organization.
     * @return badgerOrganization The newly deployed Organization contract.
     * @return organizationId The `organizationId` of the newly deployed Organization.
     */
    function createOrganization(Organization calldata _organization)
        external
        returns (BadgerOrganization badgerOrganization, uint256 organizationId);

    ////////////////////////////////////////////////////////
    ///                     GETTERS                      ///
    ////////////////////////////////////////////////////////

    /**
     * @dev Determine the address of an Organization contract given its `organizationId`.
     * @param _organizationId The `organizationId` of the Organization.
     * @return The Organization contract that is deployed on the provided `organizationId`.
     */
    function getOrganization(uint256 _organizationId)
        external
        view
        returns (BadgerOrganization);
}