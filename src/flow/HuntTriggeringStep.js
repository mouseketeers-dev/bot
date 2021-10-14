import Step from "./step";

export default class HuntTriggeringStep extends Step {

  async shouldRun(ctx) {
    return await this.guard(ctx)
      && !await ctx.page.hasKingReward()
      && !await ctx.page.hasNewJournal(ctx.state);
  }

  async guard(ctx) {
    return true;
  }
}
