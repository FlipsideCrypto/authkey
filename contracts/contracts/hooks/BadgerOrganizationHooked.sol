// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.16;

/// @dev Core dependencies.
import {IBadgerOrganizationHooked} from "../interfaces/IBadgerOrganizationHooked.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {IBadgerHook} from "../interfaces/IBadgerHook.sol";

/// @dev Libraries.
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @dev Every Badger Organization contact is built with the ability to hook into
 *      new core functionality as the consuming Organization and members evolve.
 *      With hooks, Organizations can utilize standardized or custom logic to
 *      extend the functionality of the Badger Organization simply by adding a
 *      hook contract to the Organization.
 * @notice Compromises have been accepted in this Hook implementation to ignore
 *         several poorly written EIPs that do little but add burdened overhead.
 *         When the future is different and there is actually a network of
 *         consumption, things may be updated to be more compliant however
 *         for now, this is the best solution.
 * @author CHANCE (@nftchance)
 * @author masonthechain (@masonthechain)
 */
abstract contract BadgerOrganizationHooked is
    IBadgerOrganizationHooked,
    ERC165
{
    using EnumerableSet for EnumerableSet.AddressSet;

    ////////////////////////////////////////////////////////
    ///                      STATE                       ///
    ////////////////////////////////////////////////////////

    /// @dev The hooks that are processed when a new hook is added.
    bytes32 public constant BEFORE_SET_HOOK = keccak256("beforeSetHook");

    /// @dev The hooks that are processed when a new Badge is minted.
    bytes32 public constant BEFORE_MINT = keccak256("beforeMintingHook");

    /// @dev The hooks that are processed when a Badge is revoked.
    bytes32 public constant BEFORE_REVOKE = keccak256("beforeRevokingHook");

    /// @dev The hooks that are processed when a Badge is forfeited.
    bytes32 public constant BEFORE_FORFEIT = keccak256("beforeForfeitHook");

    /// @dev The hooks that are processed when a Badge is transferred.
    bytes32 public constant BEFORE_TRANSFER = keccak256("beforeTransferHook");

    /// @dev The hooks that are processed when their triggers hit.
    /// @notice Instead of needing to loop through all of the hooks, we can
    ///         just loop through the hooks that are registered for the
    ///         specific trigger without having to have a handle mechanism
    ///         for every type of hook.
    /// @notice There is no quality enforcement on the hooks beyond a validating
    ///         the supplied address is a contract address due to the inherent
    ///         nature of suppporting multiple interfaces and functions from a
    ///         a single Hook Postman.
    mapping(bytes32 => EnumerableSet.AddressSet) internal hooks;

    ////////////////////////////////////////////////////////
    ///                     GETTERS                      ///
    ////////////////////////////////////////////////////////

    /**
     * @dev See {IBadgerOrganizationHooked-getHooks}.
     */
    function getHooks(bytes32 _slot)
        external
        view
        override
        returns (address[] memory)
    {
        /// @dev Get the hooks for the specified slot.
        EnumerableSet.AddressSet storage _hooks = hooks[_slot];

        /// @dev Create an array to hold the hooks.
        address[] memory _hookArray = new address[](_hooks.length());

        /// @dev Loop through the hooks and add them to the array.
        for (uint256 i = 0; i < _hooks.length(); i++) {
            _hookArray[i] = _hooks.at(i);
        }

        /// @dev Return the array of hooks.
        return _hookArray;
    }

    /**
     * @dev See {ERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IBadgerOrganizationHooked).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    ////////////////////////////////////////////////////////
    ///                 INTERNAL SETTERS                 ///
    ////////////////////////////////////////////////////////

    /**
     * @dev Update the state of hooks for a specified slot.
     * @param _slot The slot to update.
     * @param _slotHook The hook to add or remove.
     * @param _isHook Whether or not the hook is active.
     */
    function _setHook(
        bytes32 _slot,
        address _slotHook,
        bool _isHook
    ) internal {
        /// @dev Make sure the hook is a BadgerHook.
        require(
            ERC165(_slotHook).supportsInterface(type(IBadgerHook).interfaceId),
            "BadgerHooks::_setHook: Hook does not implement IBadgerHook."
        );

        /// @dev If the hook is active, add it to the set.
        if (_isHook) {
            /// @dev Before setting a new hook, process any Organization hooks.
            _hook(BEFORE_SET_HOOK, abi.encode(_slot, _slotHook, _isHook));

            /// @dev Add the hook to the set.
            hooks[_slot].add(_slotHook);
        } else {
            /// @dev If the hook is not active, remove it from the set.
            hooks[_slot].remove(_slotHook);
        }
    }

    /**
     * @dev Configure a hook for a specified slot.
     * @param _slot The slot to configure.
     * @param _slotHook The hook to configure.
     * @param _data The data to pass to the hook.
     */
    function _configHook(
        bytes32 _slot,
        address _slotHook,
        bytes memory _data
    ) internal {
        /// @dev Require the the module is enabled in the slot.
        require(
            hooks[_slot].contains(_slotHook),
            "BadgerHooks::_configHook: Hook is not enabled."
        );

        /// @dev Make the low level call the hook using the supplied data.
        IBadgerHook(_slotHook).config(_data);
    }

    /**
     * @dev Process the hooks for a specified slot.
     * @param _slot The slot to process.
     * @param _data The data to pass to the hooks.
     */
    function _hook(bytes32 _slot, bytes memory _data) internal {
        /// @dev Get the hooks for the slot.
        address[] memory slotHooks = hooks[_slot].values();

        /// @dev Load the stack.
        uint256 i;

        /// @dev Loop through the hooks and call them.
        for (i; i < slotHooks.length; i++) {
            /// @dev Make the execution call to the hook.
            IBadgerHook(slotHooks[i]).execute(_data);
        }
    }
}
