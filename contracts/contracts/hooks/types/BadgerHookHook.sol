// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.16;

/// @dev Core dependencies.
import {BadgerHook} from "../BadgerHook.sol";

abstract contract BadgerHookHook is BadgerHook {
    /// @dev The schema used for the execute method.
    string public constant override EXECUTE_SCHEMA = "bytes32,address,bool";
}
