import * as toml from "toml";
import * as fs from "fs";
import { LmaxMultisig } from "../target/types/lmax_multisig.js";
import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet, BN } from "@coral-xyz/anchor";
import { parse } from "ts-command-line-args";

function loadKeypair(filename: string): Keypair {
  const secret = JSON.parse(fs.readFileSync(filename).toString()) as number[];
  const secretKey = Uint8Array.from(secret);
  return Keypair.fromSecretKey(secretKey);
}

interface IClientArgs {
  connectionUrl: string;
  pathToAnchorConfig: string;
  owners: string[];
  help?: boolean;
}

const args = parse<IClientArgs>(
  {
    connectionUrl: {
      type: String,
      optional: true,
      defaultValue: "http://127.0.0.1:8899",
      description: "The connection string to the solana node",
    },
    pathToAnchorConfig: {
      type: String,
      optional: true,
      defaultValue: "./Anchor.toml",
      description: "The path to the Anchor.toml file of the solana program",
    },
    owners: {
      type: String,
      multiple: true,
      optional: true,
      description:
        "The keypair files of the owners of the multisig transactions",
    },
    help: {
      type: Boolean,
      optional: true,
      alias: "h",
      description: "Prints this usage guide",
    },
  },
  {
    helpArg: "help",
    headerContentSections: [
      { header: "Multisig Client", content: "Creates a multisig account" },
    ],
  }
);

if (!args.owners) {
  throw new Error("At least one owner is needed");
}

const PATH_TO_ANCHOR_CONFIG: string = args.pathToAnchorConfig;

const config = toml.parse(fs.readFileSync(PATH_TO_ANCHOR_CONFIG).toString());
const user = loadKeypair(config.provider.wallet);
const programAddress = new PublicKey(
  config.programs[config.provider.cluster].lmax_multisig
);

const connection = new Connection(args.connectionUrl, "confirmed");
const provider = new AnchorProvider(connection, new Wallet(user), {});
const program = new Program<LmaxMultisig>(
  JSON.parse(fs.readFileSync(config.path.idl_path).toString()),
  provider
);

const multisig = Keypair.generate();
const [_multisigSigner, nonce] = PublicKey.findProgramAddressSync(
  [multisig.publicKey.toBuffer()],
  programAddress
);

const ownersKeypairs = args.owners.map((path) => loadKeypair(path));

const ownersPubkeys = ownersKeypairs.map((keypair) => keypair.publicKey);

const asyncMain = async () => {
  const multisigTx = await program.methods
    .createMultisig(ownersPubkeys, new BN(2), nonce)
    .accounts({
      multisig: multisig.publicKey,
    })
    .signers([multisig])
    .rpc();
  // get the address of the new multisig
  console.log({ multisigTx });
  console.log({ multisig: multisig.publicKey });
};

asyncMain();
