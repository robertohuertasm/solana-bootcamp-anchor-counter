use anchor_lang::prelude::*;

declare_id!("8M9FqY8bHsN5TE6BZdDxnnZfUATbKKjmLCXjwzuQJ9ZN");

#[program]
pub mod counter {
    use super::*;

    // messages will appear in the tx logs
    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        ctx.accounts.counter.data = data;
        ctx.accounts.counter.owner = ctx.accounts.authority.key();
        msg!("Initialized counter with data: {}!", data);
        Ok(())
    }

    pub fn terminate(_ctx: Context<Terminate>) -> Result<()> {
        msg!("Terminated counter!");
        Ok(())
    }

    pub fn update(ctx: Context<Update>, quantity: u64) -> Result<()> {
        ctx.accounts.counter.data = quantity;
        msg!("Counter updated to {}", quantity);
        Ok(())
    }

    pub fn add(ctx: Context<Update>, quantity: u64) -> Result<()> {
        ctx.accounts.counter.data = ctx
            .accounts
            .counter
            .data
            .checked_add(quantity)
            .ok_or(ErrorCode::CounterOverflow)?;

        msg!(
            "Added {} to your counter. Current count: {}",
            quantity,
            ctx.accounts.counter.data
        );
        Ok(())
    }

    pub fn substract(ctx: Context<Update>, quantity: u64) -> Result<()> {
        ctx.accounts.counter.data = ctx
            .accounts
            .counter
            .data
            .checked_sub(quantity)
            .ok_or(ErrorCode::CounterOverflow)?;

        msg!(
            "Substracted {} from your counter. Current count: {}",
            quantity,
            ctx.accounts.counter.data
        );
        Ok(())
    }
}

#[account]
pub struct Counter {
    data: u64,
    owner: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action")]
    NotAuthorized,
    #[msg("Counter overflow")]
    CounterOverflow,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    // We must specify the space in order to initialize an account.
    // First 8 bytes are default account discriminator,
    // next 8 bytes come from NewAccount.data being type u64.
    // (u64 = 64 bits unsigned integer = 8 bytes + pubkey = 32)
    #[account(init, payer = authority, space = 8 + 8 + 32)]
    pub counter: Account<'info, Counter>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Terminate<'info> {
    #[account(mut, constraint = counter.owner == authority.key() @ErrorCode::NotAuthorized, close = authority)]
    pub counter: Account<'info, Counter>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut, constraint = counter.owner == authority.key() @ErrorCode::NotAuthorized)]
    pub counter: Account<'info, Counter>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
