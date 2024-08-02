{
  inputs = {
    nixpkgs.url = "github:Denommus/nixpkgs/master";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = { self, flake-utils, nixpkgs, ... }:
  flake-utils.lib.eachDefaultSystem (system:
  let
    pkgs = import nixpkgs {
      inherit system;
    };
  in {
    devShells.default = pkgs.mkShell {
      pname = "multisig-shell";

      buildInputs = [
        pkgs.anchor
        pkgs.rustup
        pkgs.pkg-config
        pkgs.nodejs_latest
      ] ++ (pkgs.lib.optionals pkgs.stdenv.isDarwin [
        pkgs.iconv
        pkgs.libiconv
      ]);
    };
  });
}
