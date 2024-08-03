{
  inputs = {
    nixpkgs.url = "github:Denommus/nixpkgs/master";
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

        package = pkgs.callPackage ./multisig.nix {};
      in
      {
        packages.default = package;
        packages.multisig = package;

        devShells.default = pkgs.mkShell {
          pname = "multisig-shell";

          buildInputs =
            [
              pkgs.rustup
              pkgs.anchor
              pkgs.nodejs_latest
              pkgs.nixfmt-rfc-style
            ]
            ++ (pkgs.lib.optionals pkgs.stdenv.isDarwin [
              pkgs.iconv
              pkgs.libiconv
            ]);
        };
      }
    );
}
