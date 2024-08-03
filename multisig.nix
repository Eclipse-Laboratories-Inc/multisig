{
  rust-bin,
  makeRustPlatform,
  pkg-config,
  lib,
  stdenv,
  iconv,
  libiconv,
}:
let
  rust = rust-bin.stable.latest.default.override {
    extensions = [
      "rust-src"
      "rust-analyzer"
    ];
  };
  rustPlatform = makeRustPlatform {
    cargo = rust;
    rustc = rust;
  };
in
rustPlatform.buildRustPackage rec {
  pname = "multisig";
  version = "0.1.0";

  src = ./.;

  cargoLock = {
    lockFile = ./Cargo.lock;
  };

  buildInputs =
    [ pkg-config ]
    ++ (lib.optionals stdenv.isDarwin [
      iconv
      libiconv
    ]);

  meta = {
    description = "LMAX Solana Multisig Contract";
    license = lib.licenses.asl20;
  };
}
