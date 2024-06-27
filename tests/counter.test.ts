import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Counter } from '../target/types/counter';
import { BN } from 'bn.js';
import { expect } from 'chai';

describe('counter', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Counter as Program<Counter>;

  describe('initialize', () => {
    it('works correctly', async () => {
      const initialData = new BN(50);
      const kp = anchor.web3.Keypair.generate();

      await program.methods
        .initialize(initialData)
        .accounts({
          counter: kp.publicKey,
          authority: provider.wallet.publicKey,
        })
        .signers([kp])
        .rpc();

      const counter = await program.account.counter.fetch(kp.publicKey);

      expect(counter.data).to.be.instanceOf(BN);
      expect(counter.data.eq(initialData)).to.be.true;
    });

    it('fails if the counter is already initialized', async () => {
      const initialData = new BN(50);
      const kp = anchor.web3.Keypair.generate();

      await program.methods
        .initialize(initialData)
        .accounts({
          counter: kp.publicKey,
          authority: provider.wallet.publicKey,
        })
        .signers([kp])
        .rpc();

      try {
        await program.methods
          .initialize(initialData)
          .accounts({
            counter: kp.publicKey,
            authority: provider.wallet.publicKey,
          })
          .signers([kp])
          .rpc();
        expect.fail(
          'The method should fail when the account is already initialized',
        );
      } catch (error) {
        expect(error).to.not.be.undefined;
      }
    });
  });

  describe('terminate', () => {
    it('works correctly', async () => {
      const initialData = new BN(50);
      const kp = anchor.web3.Keypair.generate();

      await program.methods
        .initialize(initialData)
        .accounts({
          counter: kp.publicKey,
          authority: provider.wallet.publicKey,
        })
        .signers([kp])
        .rpc();

      await program.methods
        .terminate()
        .accounts({
          counter: kp.publicKey,
          authority: provider.wallet.publicKey,
        })
        .rpc();

      try {
        await program.account.counter.fetch(kp.publicKey);
        expect.fail('The account should have been deleted');
      } catch (error) {
        expect(error).to.not.be.undefined;
        expect(error.toString()).to.contain('Account does not exist');
      }

      // NOTE: we can also do it like this although the TS return type doesn't
      // seem to work ok. Although in the typings it says it will return T | null, it doesn't work as expected (at least in my environment).
      // const counter = await program.account.counter.fetchNullable(kp.publicKey);
      // expect(counter).to.be.null;
    });

    it('fails when not authorized', async () => {
      const initialData = new BN(50);
      const kp = anchor.web3.Keypair.generate();
      const kp2 = anchor.web3.Keypair.generate();

      await program.methods
        .initialize(initialData)
        .accounts({
          counter: kp.publicKey,
          authority: provider.wallet.publicKey,
        })
        .signers([kp])
        .rpc();

      try {
        await program.methods
          .terminate()
          .accounts({
            counter: kp.publicKey,
            authority: kp2.publicKey,
          })
          .signers([kp2])
          .rpc();
        expect.fail(
          'The method should fail when the account is not authorized',
        );
      } catch (error) {
        expect(error).to.not.be.undefined;
        expect(error).to.be.instanceOf(anchor.AnchorError);
        expect((error as anchor.AnchorError).error.errorCode.number).to.be.eq(
          program.idl.errors[0].code,
        );
        expect((error as anchor.AnchorError).error.errorCode.code).to.be.eq(
          'NotAuthorized',
        );
      }
    });

    it('fails when not initialized', async () => {
      const kp = anchor.web3.Keypair.generate();

      try {
        await program.methods
          .terminate()
          .accounts({
            counter: kp.publicKey,
            authority: provider.wallet.publicKey,
          })
          .rpc();
        expect.fail(
          'The method should fail when the account is not initialized',
        );
      } catch (error) {
        expect(error).to.not.be.undefined;
        expect(error).to.be.instanceOf(anchor.AnchorError);
        expect((error as anchor.AnchorError).error.errorCode.number).to.be.eq(
          anchor.LangErrorCode.AccountNotInitialized,
        );
      }
    });
  });

  describe('update', () => {
    it('works correctly', async () => {
      const initialData = new BN(50);
      const kp = anchor.web3.Keypair.generate();

      await program.methods
        .initialize(initialData)
        .accounts({
          counter: kp.publicKey,
          authority: provider.wallet.publicKey,
        })
        .signers([kp])
        .rpc();

      const updatedData = new BN(1);

      await program.methods
        .update(updatedData)
        .accounts({
          counter: kp.publicKey,
          authority: provider.wallet.publicKey,
        })
        .rpc();

      const counter = await program.account.counter.fetch(kp.publicKey);

      expect(counter.data).to.be.instanceOf(BN);
      expect(counter.data.eq(updatedData)).to.be.true;
    });

    it('fails when not authorized', async () => {
      const initialData = new BN(50);
      const kp = anchor.web3.Keypair.generate();
      const kp2 = anchor.web3.Keypair.generate();

      await program.methods
        .initialize(initialData)
        .accounts({
          counter: kp.publicKey,
          authority: provider.wallet.publicKey,
        })
        .signers([kp])
        .rpc();

      const updatedData = new BN(1);

      try {
        await program.methods
          .update(updatedData)
          .accounts({
            counter: kp.publicKey,
            authority: kp2.publicKey,
          })
          .signers([kp2])
          .rpc();
        expect.fail(
          'The method should fail when the account is not authorized',
        );
      } catch (error) {
        expect(error).to.not.be.undefined;
        expect(error).to.be.instanceOf(anchor.AnchorError);
        expect((error as anchor.AnchorError).error.errorCode.number).to.be.eq(
          program.idl.errors[0].code,
        );
        expect((error as anchor.AnchorError).error.errorCode.code).to.be.eq(
          'NotAuthorized',
        );
      }
    });

    it('fails when not initialized', async () => {
      const kp = anchor.web3.Keypair.generate();
      const updatedData = new BN(1);

      try {
        await program.methods
          .update(updatedData)
          .accounts({
            counter: kp.publicKey,
            authority: provider.wallet.publicKey,
          })
          .rpc();
        expect.fail(
          'The method should fail when the account is not initialized',
        );
      } catch (error) {
        expect(error).to.not.be.undefined;
        expect(error).to.be.instanceOf(anchor.AnchorError);
        expect((error as anchor.AnchorError).error.errorCode.number).to.be.eq(
          anchor.LangErrorCode.AccountNotInitialized,
        );
      }
    });
  });

  describe('increment', () => {
    it('works correctly', async () => {
      const initialData = new BN(50);
      const kp = anchor.web3.Keypair.generate();

      await program.methods
        .initialize(initialData)
        .accounts({
          counter: kp.publicKey,
          authority: provider.wallet.publicKey,
        })
        .signers([kp])
        .rpc();

      const addedData = new BN(1);

      await program.methods
        .add(addedData)
        .accounts({
          counter: kp.publicKey,
          authority: provider.wallet.publicKey,
        })
        .rpc();

      const counter = await program.account.counter.fetch(kp.publicKey);

      const expectedData = initialData.add(addedData);

      expect(counter.data).to.be.instanceOf(BN);
      expect(counter.data.eq(expectedData)).to.be.true;
    });

    it('fails when not authorized', async () => {
      const initialData = new BN(50);
      const kp = anchor.web3.Keypair.generate();
      const kp2 = anchor.web3.Keypair.generate();

      await program.methods
        .initialize(initialData)
        .accounts({
          counter: kp.publicKey,
          authority: provider.wallet.publicKey,
        })
        .signers([kp])
        .rpc();

      const addedData = new BN(1);

      try {
        await program.methods
          .add(addedData)
          .accounts({
            counter: kp.publicKey,
            authority: kp2.publicKey,
          })
          .signers([kp2])
          .rpc();
        expect.fail(
          'The method should fail when the account is not authorized',
        );
      } catch (error) {
        expect(error).to.not.be.undefined;
        expect(error).to.be.instanceOf(anchor.AnchorError);
        expect((error as anchor.AnchorError).error.errorCode.number).to.be.eq(
          program.idl.errors[0].code,
        );
        expect((error as anchor.AnchorError).error.errorCode.code).to.be.eq(
          'NotAuthorized',
        );
      }
    });

    it('fails when not initialized', async () => {
      const kp = anchor.web3.Keypair.generate();
      const updatedData = new BN(1);

      try {
        await program.methods
          .add(updatedData)
          .accounts({
            counter: kp.publicKey,
            authority: provider.wallet.publicKey,
          })
          .rpc();
        expect.fail(
          'The method should fail when the account is not initialized',
        );
      } catch (error) {
        expect(error).to.not.be.undefined;
        expect(error).to.be.instanceOf(anchor.AnchorError);
        expect((error as anchor.AnchorError).error.errorCode.number).to.be.eq(
          anchor.LangErrorCode.AccountNotInitialized,
        );
      }
    });

    it('fails when it overflows', async () => {
      // Create a BN object for the maximum value of u64
      const initialData = new BN('18446744073709551615');
      const kp = anchor.web3.Keypair.generate();

      await program.methods
        .initialize(initialData)
        .accounts({
          counter: kp.publicKey,
          authority: provider.wallet.publicKey,
        })
        .signers([kp])
        .rpc();

      const addedData = new BN(1);
      try {
        await program.methods
          .add(addedData)
          .accounts({
            counter: kp.publicKey,
            authority: provider.wallet.publicKey,
          })
          .rpc();
        expect.fail('The method should fail when the counter overflows');
      } catch (error) {
        expect(error).to.not.be.undefined;
        expect(error).to.be.instanceOf(anchor.AnchorError);
        expect((error as anchor.AnchorError).error.errorCode.number).to.be.eq(
          program.idl.errors[1].code,
        );
        expect((error as anchor.AnchorError).error.errorCode.code).to.be.eq(
          'CounterOverflow',
        );
      }
    });
  });

  describe('substract', () => {
    it('works correctly', async () => {
      const initialData = new BN(50);
      const kp = anchor.web3.Keypair.generate();

      await program.methods
        .initialize(initialData)
        .accounts({
          counter: kp.publicKey,
          authority: provider.wallet.publicKey,
        })
        .signers([kp])
        .rpc();

      const removedData = new BN(1);

      await program.methods
        .substract(removedData)
        .accounts({
          counter: kp.publicKey,
          authority: provider.wallet.publicKey,
        })
        .rpc();

      const counter = await program.account.counter.fetch(kp.publicKey);

      const expectedData = initialData.sub(removedData);

      expect(counter.data).to.be.instanceOf(BN);
      expect(counter.data.eq(expectedData)).to.be.true;
    });

    it('fails when not authorized', async () => {
      const initialData = new BN(50);
      const kp = anchor.web3.Keypair.generate();
      const kp2 = anchor.web3.Keypair.generate();

      await program.methods
        .initialize(initialData)
        .accounts({
          counter: kp.publicKey,
          authority: provider.wallet.publicKey,
        })
        .signers([kp])
        .rpc();

      const removedData = new BN(1);

      try {
        await program.methods
          .substract(removedData)
          .accounts({
            counter: kp.publicKey,
            authority: kp2.publicKey,
          })
          .signers([kp2])
          .rpc();
        expect.fail(
          'The method should fail when the account is not authorized',
        );
      } catch (error) {
        expect(error).to.not.be.undefined;
        expect(error).to.be.instanceOf(anchor.AnchorError);
        expect((error as anchor.AnchorError).error.errorCode.number).to.be.eq(
          program.idl.errors[0].code,
        );
        expect((error as anchor.AnchorError).error.errorCode.code).to.be.eq(
          'NotAuthorized',
        );
      }
    });

    it('fails when not initialized', async () => {
      const kp = anchor.web3.Keypair.generate();
      const updatedData = new BN(1);

      try {
        await program.methods
          .substract(updatedData)
          .accounts({
            counter: kp.publicKey,
            authority: provider.wallet.publicKey,
          })
          .rpc();
        expect.fail(
          'The method should fail when the account is not initialized',
        );
      } catch (error) {
        expect(error).to.not.be.undefined;
        expect(error).to.be.instanceOf(anchor.AnchorError);
        expect((error as anchor.AnchorError).error.errorCode.number).to.be.eq(
          anchor.LangErrorCode.AccountNotInitialized,
        );
      }
    });

    it('fails when it overflows', async () => {
      // Create a BN object for the maximum value of u64
      const initialData = new BN('1');
      const kp = anchor.web3.Keypair.generate();

      await program.methods
        .initialize(initialData)
        .accounts({
          counter: kp.publicKey,
          authority: provider.wallet.publicKey,
        })
        .signers([kp])
        .rpc();

      const removedData = new BN(2);

      try {
        await program.methods
          .substract(removedData)
          .accounts({
            counter: kp.publicKey,
            authority: provider.wallet.publicKey,
          })
          .rpc();
        expect.fail('The method should fail when the counter overflows');
      } catch (error) {
        expect(error).to.not.be.undefined;
        expect(error).to.be.instanceOf(anchor.AnchorError);
        expect((error as anchor.AnchorError).error.errorCode.number).to.be.eq(
          program.idl.errors[1].code,
        );
        expect((error as anchor.AnchorError).error.errorCode.code).to.be.eq(
          'CounterOverflow',
        );
      }
    });
  });
});
