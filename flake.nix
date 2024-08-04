{
  inputs = {
    nixpkgs.url = "github:Denommus/nixpkgs/solana-and-anchor";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
    rust-overlay.inputs.nixpkgs.follows = "nixpkgs";
  };
  outputs =
    {
      self,
      flake-utils,
      nixpkgs,
      rust-overlay,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ (import rust-overlay) ];
        };

        package = pkgs.callPackage ./multisig.nix { };
      in
      {
        packages.default = package;
        packages.multisig = package;

        devShells.default = pkgs.mkShell {
          pname = "multisig-shell";

          buildInputs =
            [
              # Using rustup because the solana toolchain requires it
              pkgs.rustup
              pkgs.anchor
              pkgs.nodejs_latest
              pkgs.nixfmt-rfc-style
              # pkgs.solana-validator
            ]
            ++ (pkgs.lib.optionals pkgs.stdenv.isDarwin [
              pkgs.iconv
              pkgs.libiconv
            ]);
        };
      }
    );
}
