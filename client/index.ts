import * as toml from "toml";
import * as fs from 'fs';
import { LmaxMultisig } from '../target/types/lmax_multisig.js';
import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet, BN } from "@coral-xyz/anchor";

function loadKeypair(filename: string): Keypair {
    const secret = JSON.parse(fs.readFileSync(filename).toString()) as number[];
    const secretKey = Uint8Array.from(secret);
    return Keypair.fromSecretKey(secretKey);
}


const PATH_TO_ANCHOR_CONFIG: string = "../Anchor.toml";

const config = toml.parse(fs.readFileSync(PATH_TO_ANCHOR_CONFIG).toString());
const user = loadKeypair(config.provider.wallet);
const programAddress = new PublicKey(config.programs[config.provider.cluster].lmax_multisig);

const connection = new Connection("http://127.0.0.1:8899", "confirmed");
const provider = new AnchorProvider(connection, new Wallet(user), {});
const program = new Program<LmaxMultisig>(
    JSON.parse(fs.readFileSync(config.path.idl_path).toString()),
    provider,
);

const multisig = Keypair.generate();
const [_multisigSigner, nonce] = PublicKey.findProgramAddressSync(
    [multisig.publicKey.toBuffer()],
    programAddress
);

const keypair1 = loadKeypair("/Users/yuri/projetos/solanakey1.json");
const keypair2 = loadKeypair("/Users/yuri/projetos/solanakey2.json");
const keypair3 = loadKeypair("/Users/yuri/projetos/solanakey3.json");
(async () => {
    const multisigTx = await program.methods.createMultisig(
        [
            keypair1.publicKey,
            keypair2.publicKey,
            keypair3.publicKey
        ],
        new BN(2),
        nonce)
        .accounts({
            multisig: multisig.publicKey
        })
        .signers([multisig])
        .rpc();
    // get the address of the new multisig
    console.log({ multisigTx })
})();
