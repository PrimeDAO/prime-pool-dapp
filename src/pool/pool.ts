import { PLATFORM } from "aurelia-pal";
import { autoinject, singleton } from "aurelia-framework";
import "./pool.scss";
// import { Router } from "aurelia-router";
import { PoolBase } from "./poolBase";
import { EventAggregator } from "aurelia-event-aggregator";
import { EthereumService } from "services/EthereumService";
import { PoolService } from "services/PoolService";
import { Router, RouterConfiguration } from "aurelia-router";

@singleton(false)
@autoinject
export class PoolDashboard extends PoolBase {
  poolInfoTab = 1;
  router: Router;
  // liquidityBalance: number;
  // swapfee: BigNumber;
  /**
   * % number:  the amount of bprime that the user has in proportion to the total supply.
   */
  // poolUsersBPrimeShare: number;
  // currentAPY: number;
  // primeFarmed: BigNumber;
  // bPrimeStaked: BigNumber;
  // poolTotalDenormWeights: Map<Address, BigNumber>;
  // poolTokenNormWeights: Map<Address, BigNumber>;

  // token balances in bPool
  // poolBalances: Map<Address, BigNumber>;
  // poolUsersTokenShare: Map<Address, BigNumber>
  // // user balance in the given token
  // userTokenBalances: Map<Address, BigNumber>;
  // primeTokenAddress: Address;
  // wethTokenAddress: Address;
  // bPrimeTokenAddress: Address;
  // poolTokenAddresses: Array<Address>;
  // poolTotalBPrimeSupply: BigNumber;
  // poolTotalDenormWeight: BigNumber;
  // poolTokenAllowances: Map<Address, BigNumber>;
  // ethWethAmount: BigNumber;
  // wethEthAmount: BigNumber;
  // primePrice: number;

  // @computedFrom("userTokenBalances")
  // get userPrimeBalance(): BigNumber {
  //   return this.userTokenBalances?.get(this.primeTokenAddress);
  // }
  // @computedFrom("userTokenBalances")
  // get userWethBalance(): BigNumber {
  //   return this.userTokenBalances?.get(this.wethTokenAddress);
  // }
  // @computedFrom("userTokenBalances")
  // get userEthBalance(): BigNumber {
  //   return this.userTokenBalances?.get("ETH");
  // }
  // @computedFrom("userTokenBalances")
  // get userBPrimeBalance(): BigNumber {
  //   return this.userTokenBalances?.get(this.bPrimeTokenAddress);
  // }

  constructor(
    eventAggregator: EventAggregator,
    ethereumService: EthereumService,
    // private router: Router,
    poolService: PoolService) {
      super(eventAggregator,ethereumService, poolService);
  }

  // async getUserBalances(initializing = false): Promise<void> {
  //       // await this.getTokenAllowances();

  // }

  handleSetPoolInfoTab(tabNumber: number) {
    this.poolInfoTab = tabNumber;
  }


  private configureRouter(config: RouterConfiguration, router: Router) {

    // config.title = "primepool.eth";
    // config.options.pushState = true;
    // // const isIpfs = (window as any).IS_IPFS;
    // // if (isIpfs) {
    // //   this.consoleLogService.handleMessage(`Routing for IPFS: ${window.location.pathname}`);
    // // }
    // config.options.root = "/"; // window.location.pathname; // to account for IPFS
    /**
     * first set the landing page.
     * it is possible to be connected but have the wrong chain.
     */
    config.map([
      {
        route: "",
        redirect: "overview",
      }
      , {
        moduleId: PLATFORM.moduleName("./overview/overview"),
        nav: true,
        name: "overview",
        route: "overview",
        title: "Overview",
      }
      , {
        moduleId: PLATFORM.moduleName("./details/details"),
        nav: true,
        name: "details",
        route: "details",
        title: "Details",
      }
      , {
        moduleId: PLATFORM.moduleName("./price-tracker/price-tracker"),
        nav: true,
        name: "priceTracker",
        route: "priceTracker",
        title: "Price Tracker",
      }
    ]);

    config.fallbackRoute("overview");
    this.router = router;
  }

  // gotoAddLiquidity() {
  //   if (this.ensureConnected()) {
  //     // Object.assign(this,
  //     //   {
  //     //     bPoolAddress: this.contractsService.getContractAddress(ContractNames.BPOOL),
  //     //   });

  //     this.router.navigate(`liquidity/add/${this.pool.address}`);

  //     // const theRoute = this.router.routes.find(x => x.name === "liquidityAdd");
  //     // theRoute.settings.state = this;
  //     // this.router.navigateToRoute("liquidityAdd");
  //   }
  // }

  // gotoRemoveLiquidity() {
  //   if (this.ensureConnected()) {
  //     // Object.assign(this,
  //     //   {
  //     //     bPoolAddress: this.contractsService.getContractAddress(ContractNames.BPOOL),
  //     //   });

  //     this.router.navigate(`liquidity/remove/${this.pool.address}`);

  //     // const theRoute = this.router.routes.find(x => x.name === "liquidityAdd");
  //     // theRoute.settings.state = this;
  //     // this.router.navigateToRoute("liquidityAdd");
  //   }
  // }

  // async getStakingAmounts(): Promise<void> {
  //   this.currentAPY =
  //   ((this.numberService.fromString(fromWei((await this.stakingRewards.initreward()))) / 30)
  //   * this.primePrice * 365) / this.liquidityBalance;
  // }

  // async getLiquidityAmounts(): Promise<void> {
  //   try {
  //     const prices = await this.tokenService.getTokenPrices([]);

  //     // for APY
  //     this.primePrice = prices.primedao;

  //     const priceWethLiquidity =
  //       this.numberService.fromString(fromWei(await this.bPool.getBalance(this.contractsService.getContractAddress(ContractNames.WETH)))) *
  //       prices.weth;

  //     const pricePrimeTokenLiquidity =
  //         this.numberService.fromString(fromWei(await this.bPool.getBalance(this.contractsService.getContractAddress(ContractNames.PRIMETOKEN)))) *
  //       prices.primedao;

  //     this.liquidityBalance = priceWethLiquidity + pricePrimeTokenLiquidity;

  //     const poolBalances = new Map();
  //     poolBalances.set(this.primeTokenAddress, await this.primeToken.balanceOf(this.contractsService.getContractAddress(ContractNames.BPOOL)));
  //     poolBalances.set(this.wethTokenAddress, await this.weth.balanceOf(this.contractsService.getContractAddress(ContractNames.BPOOL)));
  //     this.poolBalances = poolBalances;

  //     this.poolTotalBPrimeSupply = await this.bPrimeToken.totalSupply();

  //     this.poolTotalDenormWeight = await this.bPool.getTotalDenormalizedWeight();

  //   } catch (ex) {

  //     this.eventAggregator.publish("handleException",
  //       new EventConfigException("Unable to fetch a token price", ex));
  //     this.poolBalances =
  //     this.liquidityBalance = undefined;
  //   }
  // }
  // async handleDeposit() {
  //   if (this.ensureConnected()) {
  //     if (this.ethWethAmount.gt(this.userEthBalance)) {
  //       this.eventAggregator.publish("handleValidationError", new EventConfigFailure("You don't have enough ETH to wrap the amount you requested"));
  //     } else {
  //       await this.transactionsService.send(() => this.weth.deposit({ value: this.ethWethAmount }));
  //       // TODO:  should happen after mining
  //       this.getUserBalances();
  //     }
  //   }
  // }

  // async handleWithdraw() {
  //   if (this.ensureConnected()) {
  //     if (this.wethEthAmount.gt(this.userWethBalance)) {
  //       this.eventAggregator.publish("handleValidationError", new EventConfigFailure("You don't have enough WETH to unwrap the amount you requested"));
  //     } else {
  //       await this.transactionsService.send(() => this.weth.withdraw(this.wethEthAmount));
  //       this.getUserBalances();
  //     }
  //   }
  // }

  // stakeAmount: BigNumber;

  // async handleHarvestWithdraw() {
  //   if (this.ensureConnected()) {
  //     await this.transactionsService.send(() => this.stakingRewards.exit());
  //     this.getUserBalances();
  //   }
  // }

  // gotoStaking(harvest = false) {
  //   if (this.ensureConnected()) {
  //     Object.assign(this,
  //       {
  //         harvest,
  //       });

  //     const theRoute = this.router.routes.find(x => x.name === "staking");
  //     theRoute.settings.state = this;
  //     this.router.navigateToRoute("staking");
  //   }
  // }

  // async liquidityJoinswapExternAmountIn(tokenIn, tokenAmountIn, minPoolAmountOut): Promise<void> {
  //   if (this.ensureConnected()) {
  //     await this.transactionsService.send(() => this.crPool.joinswapExternAmountIn(
  //       tokenIn,
  //       tokenAmountIn,
  //       minPoolAmountOut));
  //     await this.getLiquidityAmounts();
  //     this.getUserBalances();
  //   }
  // }

  // async liquidityJoinPool(poolAmountOut, maxAmountsIn): Promise<void> {
  //   if (this.ensureConnected()) {
  //     await this.transactionsService.send(() => this.crPool.joinPool(poolAmountOut, maxAmountsIn));
  //     await this.getLiquidityAmounts();
  //     this.getUserBalances();
  //   }
  // }

  // async liquidityExit(poolAmountIn, minAmountsOut): Promise<void> {
  //   if (this.ensureConnected()) {
  //     await this.transactionsService.send(() => this.crPool.exitPool(poolAmountIn, minAmountsOut));
  //     await this.getLiquidityAmounts();
  //     this.getUserBalances();
  //   }
  // }

  // async liquidityExitswapPoolAmountIn(tokenOutAddress, poolAmountIn, minTokenAmountOut): Promise<void> {
  //   if (this.ensureConnected()) {
  //     await this.transactionsService.send(() => this.crPool.exitswapPoolAmountIn(tokenOutAddress, poolAmountIn, minTokenAmountOut));
  //     await this.getLiquidityAmounts();
  //     this.getUserBalances();
  //   }
  // }

  // async liquiditySetTokenAllowance(tokenAddress: Address, amount: BigNumber): Promise<void> {
  //   if (this.ensureConnected()) {
  //     const tokenContract = tokenAddress === this.primeTokenAddress ? this.primeToken : this.weth;
  //     await this.transactionsService.send(() => tokenContract.approve(
  //       this.contractsService.getContractAddress(ContractNames.ConfigurableRightsPool),
  //       amount));
  //     // TODO:  should happen after mining
  //     this.getTokenAllowances();
  //   }
  // }

  // async stakingSetTokenAllowance(amount: BigNumber): Promise<void> {
  //   if (this.ensureConnected()) {
  //     const tokenContract = this.bPrimeToken;
  //     await this.transactionsService.send(() => tokenContract.approve(
  //       this.contractsService.getContractAddress(ContractNames.STAKINGREWARDS),
  //       amount));
  //     // TODO:  should happen after mining
  //     this.getTokenAllowances();
  //   }
  // }

  // async stakingStake(amount: BigNumber): Promise<void> {
  //   if (this.ensureConnected()) {
  //     await this.transactionsService.send(() => this.stakingRewards.stake(amount));
  //     // TODO:  should happen after mining
  //     this.getUserBalances();
  //   }
  // }

  // async stakingHarvest(): Promise<void> {
  //   if (this.ensureConnected()) {
  //     await this.transactionsService.send(() => this.stakingRewards.getReward());
  //     // TODO:  should happen after mining
  //     this.getUserBalances();
  //   }
  // }


  // async stakingExit(): Promise<void> {
  //   if (this.ensureConnected()) {
  //     if (this.bPrimeStaked.isZero()) {
  //       this.eventAggregator.publish("handleValidationError", new EventConfigFailure("You have not staked any BPRIME, so there is nothing to exit"));
  //     } else {
  //       await this.transactionsService.send(() => this.stakingRewards.exit());
  //     }
  //     this.getUserBalances();
  //   }
  // }

  // handleGetMax() {
  //   this.wethEthAmount = this.userWethBalance;
  // }
}
