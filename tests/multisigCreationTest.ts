import assert from "assert";
import { setUpValidator } from "./utils/before";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { MultisigDsl } from "./utils/multisigDsl";
import { describe } from "mocha";
import { fail } from "node:assert";
import { LmaxMultisig } from "../target/types/lmax_multisig";

describe("Test creation of multisig account", async () => {
  let provider: AnchorProvider;
  let program: Program<LmaxMultisig>;
  let dsl: MultisigDsl;
  before(async () => {
    let result = await setUpValidator(false);
    program = result.program;
    provider = result.provider;
    dsl = new MultisigDsl(program, provider);
  });

  it("should create multisig account", async () => {
    const multisig = await dsl.createMultisig(2, 3);

    let actualMultisig = await program.account.multisig.fetch(multisig.address);
    assert.strictEqual(actualMultisig.nonce, multisig.nonce);
    assert.ok(multisig.threshold.eq(actualMultisig.threshold));
    assert.deepStrictEqual(
      actualMultisig.owners,
      multisig.owners.map((owner) => owner.publicKey)
    );
    assert.strictEqual(actualMultisig.ownerSetSeqno, 0);
  });

  it("should create multiple multisig accounts", async () => {
    const [ownerA, ownerB, ownerC, ownerD, ownerE] = Array.from(
      { length: 5 },
      (_, _n) => Keypair.generate()
    );
    const multisig1 = await dsl.createMultisigWithOwners(2, [
      ownerA,
      ownerB,
      ownerC,
    ]);
    const multisig2 = await dsl.createMultisigWithOwners(2, [
      ownerC,
      ownerD,
      ownerE,
    ]);

    let actualMultisig1 = await program.account.multisig.fetch(
      multisig1.address
    );
    let actualMultisig2 = await program.account.multisig.fetch(
      multisig2.address
    );

    assert.strictEqual(actualMultisig1.nonce, multisig1.nonce);
    assert.ok(multisig1.threshold.eq(actualMultisig1.threshold));
    assert.deepStrictEqual(
      actualMultisig1.owners,
      multisig1.owners.map((owner) => owner.publicKey)
    );
    assert.strictEqual(actualMultisig1.ownerSetSeqno, 0);

    assert.strictEqual(actualMultisig2.nonce, multisig2.nonce);
    assert.ok(multisig2.threshold.eq(actualMultisig2.threshold));
    assert.deepStrictEqual(
      actualMultisig2.owners,
      multisig2.owners.map((owner) => owner.publicKey)
    );
    assert.strictEqual(actualMultisig2.ownerSetSeqno, 0);
  });

  it("should fail to create if provided threshold is greater than number of owners", async () => {
    try {
      await dsl.createMultisig(4, 3);
      fail("Multisig should not have been created");
    } catch (e: any) {
      assert.match(
        e.message,
        new RegExp(
          ".*Error Code: InvalidThreshold. Error Number: 6008. Error Message: Threshold must be less than or equal to the number of owners and greater than zero."
        )
      );
    }
  });

  it("should not create multisig with 0 threshold", async () => {
    try {
      await dsl.createMultisig(0, 3);
      fail("Multisig should not have been created");
    } catch (e: any) {
      assert.match(
        e.message,
        new RegExp(
          ".*Error Code: InvalidThreshold. Error Number: 6008. Error Message: Threshold must be less than or equal to the number of owners and greater than zero."
        )
      );
    }
  });

  it("should not create multisig with 0 threshold and no owners", async () => {
    try {
      await dsl.createMultisigWithOwners(0, []);
      fail("Multisig should not have been created");
    } catch (e: any) {
      assert.match(
        e.message,
        new RegExp(
          ".*Error Code: InvalidThreshold. Error Number: 6008. Error Message: Threshold must be less than or equal to the number of owners and greater than zero."
        )
      );
    }
  });

  it("should not create multisig with duplicate owners", async () => {
    const [ownerA, ownerB] = Array.from({ length: 2 }, (_, _n) =>
      Keypair.generate()
    );
    try {
      await dsl.createMultisigWithOwners(2, [ownerA, ownerA, ownerB]);
      fail("Multisig should not have been created");
    } catch (e: any) {
      assert.match(
        e.message,
        new RegExp(
          ".*Error Code: UniqueOwners. Error Number: 6009. Error Message: Owners must be unique."
        )
      );
    }
  });

  it("should not create multisig account with bad nonce", async () => {
    try {
      await dsl.createMultisigWithBadNonce(2, 3);
      fail("Multisig should not have been created");
    } catch (e: any) {
      assert.match(
        e.message,
        new RegExp(
          ".*AnchorError caused by account: multisig_signer. Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated."
        )
      );
    }
  });
});
