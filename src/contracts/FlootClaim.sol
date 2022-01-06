/**  
  TODO:
 -[x] Fixed FLOOT claim amount per Familiar
 -[x] Remove certain familiar IDs
 -[] 1 year after which owner can withdraw FLOOT (in case auction is done but some floot remain)
*/

// https://opensea.io/collection/loot-familiars
// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;


// File: @openzeppelin/contracts/math/SafeMath.sol

/**
 * @dev Wrappers over Solidity's arithmetic operations with added overflow
 * checks.
 *
 * Arithmetic operations in Solidity wrap on overflow. This can easily result
 * in bugs, because programmers usually assume that an overflow raises an
 * error, which is the standard behavior in high level programming languages.
 * `SafeMath` restores this intuition by reverting the transaction when an
 * operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryAdd(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        uint256 c = a + b;
        if (c < a) return (false, 0);
        return (true, c);
    }

    /**
     * @dev Returns the substraction of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function trySub(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        if (b > a) return (false, 0);
        return (true, a - b);
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryMul(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) return (true, 0);
        uint256 c = a * b;
        if (c / a != b) return (false, 0);
        return (true, c);
    }

    /**
     * @dev Returns the division of two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryDiv(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        if (b == 0) return (false, 0);
        return (true, a / b);
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryMod(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        if (b == 0) return (false, 0);
        return (true, a % b);
    }

    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        return a - b;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) return 0;
        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");
        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "SafeMath: division by zero");
        return a / b;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "SafeMath: modulo by zero");
        return a % b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {trySub}.
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        return a - b;
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {tryDiv}.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        return a / b;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting with custom message when dividing by zero.
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {tryMod}.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        return a % b;
    }
}

// File: @openzeppelin/contracts/utils/Context.sol

/*
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with GSN meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address payable) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return msg.data;
    }
}


// File: @openzeppelin/contracts/access/Ownable.sol

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor () internal {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}


/**
 * Minimal ERC-721 interface Familiars implement
 */

interface ERC721Interface {
  function ownerOf(uint256 tokenId) external view returns (address owner);
}

/**
 * Minimal ERC-20 interface Familiars implement
 */

interface ERC20Interface {
  function balanceOf(address owner) external view returns (uint256 balance);
  function transfer(uint256 amount, address recipient) external returns (bool);
}


/**
 * @title Familiars (For Adventurers) contract. All revenue from Familiars will
 * be used to purchase floor Loots, which will then be fractionalized to Familiars
 * owners.
 */
contract FlootClaim is Ownable {
    using SafeMath for uint256;

    // Amount of FLOOT each familiar can claim
    uint256 constant public FLOOT_PER_FAMILIAR = 10000 * 10**18; // 10k FLOOT per familiar

    // Familiar contracts
    address public immutable FAMILIAR_ADDRESS;
    ERC721Interface immutable familiarContract;   // Real familiars
    ERC721Interface immutable v1FamiliarContract; // V1 familiars

    // FLOOT contract
    address public immutable FLOOT_ADDRESS;
    ERC20Interface immutable flootContract;

    // Tracks which familiar has claimed their FLOOT
    mapping (uint256 => bool) public claimed;
    mapping (uint256 => bool) public allowedV1;
 
    // Store Familiar and FLOOT contracts
    constructor(address _v1FamiliarAddress, address _familiarAddress,  address _flootAddress) {
      FAMILIAR_ADDRESS = _familiarAddress;
      familiarContract = ERC721Interface(_familiarAddress);
      v1FamiliarContract = ERC721Interface(_v1FamiliarAddress);

      FLOOT_ADDRESS = _flootAddress;
      flootContract = ERC20Interface(_flootAddress);
    }

    // Sets a V2 familiar minted from V1 as being eligible
    function enableV1Claim(uint256[] calldata _ids) external onlyOwner {
      for (uint256 i = 0; i < _ids.length; i++) {
        allowedV1[_ids[i]] = true;
      }
    }

    // Sets a V2 familiar from V1 as NOT eligible
    function disableV1Claim(uint256[] calldata _ids) external onlyOwner {
      for (uint256 i = 0; i < _ids.length; i++) {
        allowedV1[_ids[i]] = false;
      }
    }

    // Sends FLOOT to owner of _id, if FLOOT hasn't been claimed yet
    function claim(uint256 _id) external {
      _claim(_id);
    }
    
    // Sends FLOOT to respective owner of all familiars in _ids, if FLOOT hasn't been claimed yet
    function multiClaim(uint256[] memory _ids) external {
      for (uint256 i = 0; i < _ids.length; i++) {
        _claim(_ids[i]);
      }
    }
  
    function _claim(uint256 _id) private {
      require(isClaimable(_id), "Familiar cannot claim FLOOT");

      // Transfer floot to familiar owner
      address familiarOwner = familiarContract.ownerOf(_id);
      (bool success, bytes memory data) = address(flootContract).call(abi.encodeWithSelector(0xa9059cbb, familiarOwner, FLOOT_PER_FAMILIAR));
      require(success && (data.length == 0 || abi.decode(data, (bool))), 'Floot transfer failed');
      claimed[_id] = true;
    }

    // Check if you can claim a given familiar
    function isClaimable(uint256 _id) public view returns (bool claimable) {
      return !claimed[_id] && isAllowed(_id) ? true : false;
    }

    // Check if a familiar is not eligible for claiming FLOOT
    function isAllowed(uint256 _id) public view returns (bool allowed) {
      // ID must be within valid range
      if (_id == 0 || _id > 8000) { return false; }

      // If v1 exists but is not allowed, return false, else return true
      try v1FamiliarContract.ownerOf(_id) {
        if (!allowedV1[_id]) {
          return false;
        }
        return true;

      } catch {
        // V1 familiar does not exist, so familiar must be allowed
        return true;
      }
    }
}