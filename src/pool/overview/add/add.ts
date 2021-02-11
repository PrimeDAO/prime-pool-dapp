import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, ICollectionObserverSplice, singleton } from "aurelia-framework";
import { BigNumber } from "ethers";
import { toBigNumberJs } from "services/BigNumberService";
import { calcPoolOutGivenSingleIn } from "services/BalancerPoolLiquidity/helpers/math";
import { calcPoolTokensByRatio } from "services/BalancerPoolLiquidity/helpers/utils";
import { Address, EthereumService } from "services/EthereumService";
import "../liquidity.scss";
import BigNumberJs from "services/BigNumberService";
import { PoolService } from "services/PoolService";
import { Router } from "aurelia-router";
import { IPoolTokenInfo } from "entities/pool";
import { AureliaHelperService } from "services/AureliaHelperService";
import { PoolBase } from "pool/poolBase";
import TransactionsService from "services/TransactionsService";

const BALANCE_BUFFER = 0.01;

interface IPoolTokenInfoEx extends IPoolTokenInfo {
  inputAmount: BigNumber;
}

@singleton(false)
@autoinject
export class LiquidityAdd extends PoolBase {

  constructor(
    protected eventAggregator: EventAggregator,
    ethereumService: EthereumService,
    poolService: PoolService,
    private router: Router,
    private transactionsService: TransactionsService,
    private aureliaHelperService: AureliaHelperService) {
      super(eventAggregator, ethereumService, poolService);
  }

  private amounts = new Map<Address, string>();
  private poolTokens: any;
  private selectedTokens = new Array<IPoolTokenInfoEx>();

  protected activate(model: { poolAddress: Address }): void {

    super.activate(model);

    this.subscriptions.push(this.aureliaHelperService.createPropertyWatch(this.selectedTokens, "length", this.handleTokenSelectedChange.bind(this)));
    this.subscriptions.push(this.aureliaHelperService.createCollectionWatch(this.selectedTokens, this.handleTokenSelected.bind(this)));

    if (!this.pool || (this.pool.address !== model.poolAddress)) {
      this.pool.assetTokens.forEach((token) => {

        // Object.defineProperty(token, "showUnlock", {
        //   get: () => {
        //     !this.getSelectedInvalidTokenAdd() && !this.getSelectedTokenHasSufficientAllowance()(token as IPoolTokenInfoEx);          }
        // });
        this.aureliaHelperService.createPropertyWatch(token, "showUnlock", () => {});
      });
    }
  }

  private getSelectedToken(): IPoolTokenInfoEx {
    return this.getIsSingleAsset() ? this.selectedTokens[0] : null;
  }

  private getSelectedTokenAmount(): BigNumber {
    return this.getSelectedToken()?.inputAmount;
  }

  /**
   * true if more than one non-zero assets are entered
   */
  private getIsMultiAsset(): boolean {
    return this.selectedTokens.length > 1;
  }

  /**
   * true if exactly one non-zero asset is entered
   */
  private getIsSingleAsset(): boolean {
    return this.selectedTokens.length === 1;
  }

  private getSelectedTokenAddress(): Address {
    return this.getSelectedToken()?.address;
  }

  private getShowTokenUnlock(token: IPoolTokenInfoEx): boolean {
    return !this.getInvalidTokenAdd(token) && !this.getSelectedTokenHasSufficientAllowance();
  }

  private getSelectedTokenHasSufficientAllowance(): boolean {
    return this.getSelectedToken().userAllowance.gte(this.getSelectedTokenAmount() || BigNumber.from(0));
  }

  private getTokenHasSufficientAllowance(token: IPoolTokenInfoEx): boolean {
    return token.userAllowance.gte(this.getSelectedTokenAmount() || BigNumber.from(0));
  }


  private handleTokenSelectedChange(newLength: number) {
  }

  private handleTokenSelected(splices: Array<ICollectionObserverSplice<IPoolTokenInfoEx>>) {
    if (splices.length > 1) {
      throw new Error(`splices should be equal to 1`);
    }

    splices.forEach(splice => {
      let token: IPoolTokenInfoEx;
      if (splice.addedCount >= 2) {
        throw new Error(`splice.addedCount should be 0 or 1`);
      }

      const valuesAdded = this.selectedTokens.slice(splice.index, splice.index + splice.addedCount);

      if (valuesAdded.length > 0) {
        if (splice.removed.length > 0) {
          throw new Error(`splice.removed.length should be 0`);
        }
        // console.log(`The following values were inserted at ${splice.index}: ${JSON.stringify(valuesAdded)}`);
        token = valuesAdded[0];
      } else {
        if (splice.removed.length >= 2) {
          throw new Error(`splice.removed.length should be 0 or 1`);
        }

        if (splice.removed.length > 0) {
          // console.log(`The following values were removed from ${splice.index}: ${JSON.stringify(splice.removed)}`);
          token = splice.removed[0];
        }
      }

      this.poolTokens = null;
      this.amounts.delete(token.address);
      token.inputAmount = null;
      this.handleAmountChange(token);
    });
  }

  private handleAmountChange(token: IPoolTokenInfoEx): void {
      setTimeout(() => this.amountChanged(
        token.inputAmount,
        token.address), 100);
  }

//   @computedFrom("poolTokens", "model.userBPrimeBalance", "model.poolTotalBPrimeSupply")
//   private get userLiquidity() {
//     const userShares = toBigNumberJs(this.model.userBPrimeBalance);
//     const totalShares = toBigNumberJs(this.model.poolTotalBPrimeSupply);
//     const current = userShares.div(totalShares).integerValue(BigNumberJs.ROUND_UP);
//     if (this.getInvalid()) {
//       return {
//         absolute: {
//           current: BigNumber.from(userShares.toString()),
//         },
//         relative: {
//           current: BigNumber.from(current.toString()),
//         },
//       };
//     }

//     const poolTokens = toBigNumberJs(this.poolTokens ?? "0");

//     const future = userShares.plus(poolTokens)
//       .div(totalShares.plus(poolTokens))
//       .integerValue(BigNumberJs.ROUND_UP);

//     return {
//       absolute: {
//         current: BigNumber.from(userShares.toString()),
//         future: BigNumber.from(userShares.plus(poolTokens).toString()),
//       },
//       relative: {
//         current: BigNumber.from(current.toString()),
//         future: BigNumber.from(future.toString()),
//       },
//     };
//   }

//   private showSlippage: boolean;

//   private refreshShowSlippage() {
//     this.showSlippage =
//       this.selectedTokenAddress() &&
//       !this.getInvalid() &&
//       (!!this.amounts.get(this.selectedTokenAddress()) && BigNumber.from(this.amounts.get(this.selectedTokenAddress())).gt(0));
//   }

//   @computedFrom("showSlippage", "getSelectedTokenAmount()", "wethAmount", "bPrimeAmount", "model.poolBalances", "model.poolTotalBPrimeSupply", "model.poolTotalDenormWeights", "model.poolTotalDenormWeight")
//   private get slippage(): string {
//     this.refreshShowSlippage();
//     if (!this.showSlippage) {
//       return undefined;
//     }
//     const tokenAddress = this.selectedTokenAddress();
//     const tokenBalance = toBigNumberJs(this.model.poolBalances.get(tokenAddress));
//     const poolTokenShares = toBigNumberJs(this.model.poolTotalBPrimeSupply);
//     const tokenWeight = toBigNumberJs(this.model.poolTotalDenormWeights.get(tokenAddress));
//     const totalWeight = toBigNumberJs(this.model.poolTotalDenormWeight);
//     const swapfee = toBigNumberJs(this.model.swapfee);

//     let amount = toBigNumberJs(this.amounts.get(tokenAddress));

//     let amountOut: BigNumberJs;
//     let expectedAmount: BigNumberJs;

//       const roundedIntAmount = toBigNumberJs(amount.integerValue(BigNumberJs.ROUND_UP));

//       amountOut = calcPoolOutGivenSingleIn(
//         tokenBalance,
//         tokenWeight,
//         poolTokenShares,
//         totalWeight,
//         roundedIntAmount,
//         swapfee);

//       expectedAmount = roundedIntAmount
//         .times(tokenWeight)
//         .times(poolTokenShares)
//         .div(tokenBalance)
//         .div(totalWeight);

//     return toBigNumberJs(1)
//       .minus(amountOut.div(expectedAmount))
//       .times(100)
//       .toString();
//   }

  private amountChanged(
    changedAmount: BigNumber,
    changedToken: Address,
  ): void {

    // changedAmount = changedAmount ?? BigNumber.from(0);

    // const changedTokenBalance = toBigNumberJs(this.model.poolBalances.get(changedToken));
    // const ratio = toBigNumberJs(changedAmount).div(changedTokenBalance);
    // const poolTokenShares = toBigNumberJs(this.model.poolTotalBPrimeSupply);

    // if (this.getIsMultiAsset()) {
    //   this.poolTokens = calcPoolTokensByRatio(
    //     toBigNumberJs(ratio),
    //     toBigNumberJs(poolTokenShares));
    // } else if (this.getIsSingleAsset()) {
    //   const tokenIn = this.selectedTokenAddress();
    //   const amount = toBigNumberJs(this.getSelectedTokenAmount());
    //   const tokenInBalanceIn = toBigNumberJs(this.model.poolBalances.get(tokenIn));
    //   const maxInRatio = 1 / 2;
    //   if (amount.div(tokenInBalanceIn).gt(maxInRatio)) {
    //     return;
    //   }

    //   const tokenWeightIn = this.model.poolTotalDenormWeights.get(tokenIn);
    //   const tokenAmountIn = amount.integerValue(BigNumberJs.ROUND_UP);
    //   const totalWeight = toBigNumberJs(this.model.poolTotalDenormWeight);

    //   this.poolTokens = calcPoolOutGivenSingleIn(
    //     tokenInBalanceIn,
    //     toBigNumberJs(tokenWeightIn),
    //     poolTokenShares,
    //     totalWeight,
    //     tokenAmountIn,
    //     toBigNumberJs(this.model.swapfee))
    //     .toString();
    // }

    // this.amounts.set(changedToken, changedAmount.toString());

    // if (this.getIsMultiAsset()) {

    //   this.model.poolTokenAddresses.map(tokenAddr => {
    //     if (tokenAddr !== changedToken) {
    //       const balancedAmountString = ratio.isNaN() ? "" :
    //         ratio.times(toBigNumberJs(this.model.poolBalances.get(tokenAddr)))
    //           .integerValue(BigNumberJs.ROUND_UP)
    //           .toString();

    //       this.amounts.set(tokenAddr, balancedAmountString);
    //       // since we're not yet binding the UI to an array of tokens
    //       const balancedAmount = BigNumber.from(balancedAmountString);
    //       if (tokenAddr === this.model.wethTokenAddress) {
    //         this.wethAmount = balancedAmount;
    //       } else {
    //         this.getSelectedTokenAmount() = balancedAmount;
    //       }
    //       // this.setAmount((tokenAddr === this.model.wethTokenAddress) ?
    //       //   this.model.primeTokenAddress : this.model.wethTokenAddress, balancedAmount);
    //     }
    //   });
    // }
    // // TODO: figure out smarter way to handle this dependency
    // this.refreshShowSlippage();
  }

//   private assetsAreLocked(issueMessage = true): boolean {
//     let message: string;
//     if (this.getIsMultiAsset()) {
//       if (!this.primeHasSufficientAllowance || !this.wethHasSufficientAllowance) {
//         message = "Before adding you need to unlock PRIME and/or WETH tokens for transfer";
//       }
//     } else if (this.getIsSingleAsset()) {
//       if (this.tokenSelected) {
//         if (!this.primeHasSufficientAllowance) {
//           message = "Before adding you need to unlock the PRIME tokens for transfer";
//         }
//       } else {
//         if (!this.wethHasSufficientAllowance) {
//           message = "Before adding you need to unlock the WETH tokens for transfer";
//         }
//       }
//     }

//     if (message) {
//       if (issueMessage) {
//         this.eventAggregator.publish("handleValidationError", message);
//       }
//       return false;
//     }

//     return true;
//   }

  /**
   * return error message if not valid enough to submit, except for checking unlocked condition
  */
  private getInvalid(): string {
    let message: string;

    if (this.getIsSingleAsset()) {
      message = this.getInvalidTokenAdd(this.getSelectedToken());

      if (!message) {
        const maxInRatio = 1 / 2;
        const amount = toBigNumberJs(this.amounts.get(this.getSelectedTokenAddress()));
        const tokenBalance = toBigNumberJs(this.getSelectedToken().balanceInPool);

        if (amount.div(tokenBalance).gt(maxInRatio)) {
          message = "Insufficient pool liquidity.  Reduce the amount you wish to add.";
        }
      }
    } else if (this.getIsMultiAsset()) {
      for (const token of this.selectedTokens) {
        message = this.getInvalidTokenAdd(token);
        if (message) break;
      }
    } else {
      message = `To buy ${this.pool.poolToken.symbol} you must select at least one asset to stake`;
    }

    return message;
  }

  private getInvalidTokenAdd(token: IPoolTokenInfoEx): string {
    let message: string;

    if (!token.inputAmount || token.inputAmount.isZero()) {
      message = `Please specify an amount of ${token.symbol}`;
    } else {
      if (token.inputAmount.gt(token.userBalance)) {
        message = `Cannot add this amount of ${token.symbol} because it exceeds your balance`;
      }
    }

    /**
     * TODO confirm this is commented-out in RA I
     */

    // if (!this.primeHasSufficientAllowance) {
    //   message = "Can't add this amount, you will exceed your balance of PRIME";
    // }

    return message;
  }

  private isValid(): boolean {
    let message;

    if (!message) {
      message = this.getInvalid();
    }

    if (message) {
      this.eventAggregator.publish("handleValidationError", message);
    }

    return !message;
  }

  // private async handleSubmit(): Promise<void> {

  //   if (!this.isValid() || !this.assetsAreLocked()) {
  //     return;
  //   }

  //   if (this.getIsMultiAsset()) {
  //   // computed by amountChanged
  //     const poolAmountOut = this.poolTokens;
  //     const maxAmountsIn =
  //       this.model.poolTokenAddresses.map(tokenAddress => {
  //         // this.amounts computed by amountChanged
  //         const inputAmountIn = toBigNumberJs(this.amounts.get(tokenAddress))
  //           .div(1 - BALANCE_BUFFER)
  //           .integerValue(BigNumberJs.ROUND_UP);
  //         /**
  //        * pool is crPool
  //        * balance of the token held by the crPool
  //        */
  //         const balanceAmountIn = toBigNumberJs(this.model.userTokenBalances.get(tokenAddress));
  //         const tokenAmountIn = BigNumberJs.min(inputAmountIn, balanceAmountIn);
  //         return tokenAmountIn.toString();
  //       });

  //     this.model.liquidityJoinPool(poolAmountOut, maxAmountsIn);

  //   } else if (this.getIsSingleAsset()) {
  //     const tokenIn = this.selectedTokenAddress();
  //     if (!tokenIn) {
  //       return;
  //     }

  //     const tokenAmountIn = toBigNumberJs(this.amounts.get(tokenIn))
  //       .integerValue(BigNumberJs.ROUND_UP)
  //       .toString();

  //     const minPoolAmountOut = toBigNumberJs(this.poolTokens)
  //       .times(1 - BALANCE_BUFFER)
  //       .integerValue(BigNumberJs.ROUND_UP)
  //       .toString();

  //     this.model.liquidityJoinswapExternAmountIn(tokenIn, tokenAmountIn, minPoolAmountOut);
  //   }
  // }

  private handleGetMaxToken(token: IPoolTokenInfoEx) {
    token.inputAmount = token.userBalance;
    this.handleAmountChange(token);
  }

  private unlock(token: IPoolTokenInfoEx) {
    this.setTokenAllowance(token);
  }


//  private liquidityJoinPool(poolAmountOut, maxAmountsIn): Promise<void> {

//   }

//  private liquidityJoinswapExternAmountIn(tokenIn, tokenAmountIn, minPoolAmountOut): Promise<void> {

//   }

private async setTokenAllowance(token: IPoolTokenInfoEx): Promise<void> {
  if (this.ensureConnected()) {
    
    await this.transactionsService.send(() => token.tokenContract.approve(this.pool.address, token.inputAmount));

    this.pool.hydrateUserValues();
  }
}

  goBack() {
    this.router.navigateBack();
  }
}

// interface ILiquidityModel {
//   poolBalances: Map<Address, BigNumber>;
//   userWethBalance: BigNumber;
//   poolTotalDenormWeights: Map<string, BigNumber>;
//   poolTokenAddresses: Array<Address>;
//   poolTokenAllowances: Map<Address, BigNumber>;
//   poolTotalBPrimeSupply: BigNumber;
//   poolTotalDenormWeight: BigNumber;
// }
