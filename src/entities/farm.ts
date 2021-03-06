import { NumberService } from "services/numberService";
import { IFarmConfig } from "services/FarmService";
import { autoinject } from "aurelia-framework";
import { ContractNames, ContractsService } from "services/ContractsService";
import { Address, EthereumService } from "services/EthereumService";
import { DisposableCollection } from "services/DisposableCollection";
import { EventAggregator } from "aurelia-event-aggregator";
import { Pool } from "entities/pool";
import { PoolService } from "services/PoolService";
import { ITokenInfo, TokenService } from "services/TokenService";
import { BigNumber } from "ethers";
import TransactionsService from "services/TransactionsService";


@autoinject
export class Farm implements IFarmConfig {
  /**
   * IFarmConfig properties....
   */
  poolAddress: Address;
  address: Address;
  name: string;
  /**
   * additional propoerties...
   */
  contract: any;
  pool: Pool;
  public connected = false;
  rewardTokenAddress: Address;
  rewardTokenInfo: ITokenInfo;
  rewardTokenContract: any;
  stakingTokenAddress: Address;
  stakingTokenInfo: ITokenInfo;
  stakingTokenContract: any;
  /**
   * amount of the reward token that the user is due to receive
   */
  rewardTokenRewardable: BigNumber;
  /**
   * amount of staking token that this contract currently holds for the user
   */
  stakingTokenFarming: BigNumber;
  stakingTokenAllowance: BigNumber;
  /**
   * in seconds
   **/
  duration: number;

  private subscriptions: DisposableCollection = new DisposableCollection();

  public constructor(
    private contractsService: ContractsService,
    private ethereumService: EthereumService,
    private eventAggregator: EventAggregator,
    private poolService: PoolService,
    private tokenService: TokenService,
    private numberService: NumberService,
    private transactionsService: TransactionsService,
  ) {

    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
      await this.loadContracts();
      this.hydrateUserValues();
    }));

    /**
     * TODO: watch for changes in the user's balance of reward and staking tokens
     */
  }

  /**
   * assumes the relevant properties have been previously loaded.
   * @param config
   * @param full
   */
  private async loadContracts(
    contract?: any,
  ): Promise<void> {

    this.contract = contract ?? await this.contractsService.getContractAtAddress(
      ContractNames.STAKINGREWARDS,
      this.address);

    if (!this.rewardTokenAddress) {
      this.rewardTokenAddress = await this.contract.rewardToken();
    }

    if (!this.stakingTokenAddress) {
      this.stakingTokenAddress = await this.contract.stakingToken();
    }

    this.rewardTokenContract = await this.contractsService.getContractAtAddress(ContractNames.IERC20, this.rewardTokenAddress);
    this.stakingTokenContract = await this.contractsService.getContractAtAddress(ContractNames.IERC20, this.stakingTokenAddress);
  }

  public async initialize(config: IFarmConfig, full = true): Promise<Farm> {
    /**
     * do a partial initialization only if the pool has previously been initialized
     * !full means the list of tokens will be retained, but their values will be refreshed.
     */
    if (!full && !this.address) {
      full = true; // shouldn't ever happen
    }

    if (full) {
      Object.assign(this, config);
    }

    if (full) {

      await this.poolService.ensureInitialized();
      this.pool = this.poolService.pools.get(this.poolAddress);

      await this.loadContracts();

      this.rewardTokenInfo = (await this.tokenService.getTokenInfoFromAddress(this.rewardTokenAddress)) as ITokenInfo;
      this.stakingTokenInfo = (await this.tokenService.getTokenInfoFromAddress(this.stakingTokenAddress)) as ITokenInfo;
      this.duration = await this.contract.DURATION();
    }

    await this.hydrateUserValues();

    return this;
  }

  public async hydrateUserValues(): Promise<void> {

    const accountAddress = this.ethereumService.defaultAccountAddress;

    if (accountAddress) {
      /**
       * current balance of rewardable reward tokens
       */
      this.rewardTokenRewardable = await this.contract.earned(this.ethereumService.defaultAccountAddress);
      this.stakingTokenFarming = await this.contract.balanceOf(this.ethereumService.defaultAccountAddress);
      this.stakingTokenAllowance = await this.stakingTokenContract.allowance(this.ethereumService.defaultAccountAddress, this.address);
      this.connected = true;
    } else {
      this.connected = false;
    }
  }

  public async stakingHarvest(): Promise<void> {
    if (this.connected) {
      if (await this.transactionsService.send(() => this.contract.getReward())) {
        this.hydrateUserValues();
        this.pool.hydrateUserValues();
      }
    }
  }

  public async stakingExit(): Promise<void> {
    if (this.connected) {
      if (await this.transactionsService.send(() => this.contract.exit())) {
        this.hydrateUserValues();
        this.pool.hydrateUserValues();
      }
    }
  }

  public async stake(amount: BigNumber): Promise<void> {
    if (this.connected) {
      if (await this.transactionsService.send(() => this.contract.stake(amount))) {
        this.hydrateUserValues();
        this.pool.hydrateUserValues();
      }
    }
  }
}
