# Maintainer: Ayash Bera ayashbera@gmail.com
pkgname=keyshade
pkgver=3.0.2
pkgrel=1
pkgdesc="Realtime secret and configuration management CLI tool with end-to-end encryption"
arch=('any')
url="https://github.com/keyshade-xyz/keyshade"
license=('MPL2')
depends=('nodejs' 'npm')
optdepends=('git: for git integration features')
source=("https://registry.npmjs.org/@keyshade/cli/-/cli-$pkgver.tgz")
sha256sums=('5a27a8e37846acf91d46e80d4dc76ff4dbf15430d6482006e934d7d92752cafe')

package() {
    cd "$srcdir/package"
    
    # Create directory structure
    install -dm755 "$pkgdir/usr/lib/node_modules/@keyshade/cli"
    install -dm755 "$pkgdir/usr/bin"
    
    # Copy all package files to the node_modules location
    cp -r * "$pkgdir/usr/lib/node_modules/@keyshade/cli/"
    
    # Make the main script executable
    chmod +x "$pkgdir/usr/lib/node_modules/@keyshade/cli/dist/index.cjs"
    
    # Create the binary symlink (this is how npm would normally do it)
    ln -s "../lib/node_modules/@keyshade/cli/dist/index.cjs" "$pkgdir/usr/bin/keyshade"
    
    # Remove unnecessary development files to reduce package size
    rm -rf "$pkgdir/usr/lib/node_modules/@keyshade/cli/src"
    rm -rf "$pkgdir/usr/lib/node_modules/@keyshade/cli/.turbo"
    rm -f "$pkgdir/usr/lib/node_modules/@keyshade/cli/.eslintrc.cjs"
    rm -f "$pkgdir/usr/lib/node_modules/@keyshade/cli/.swcrc" 
    rm -f "$pkgdir/usr/lib/node_modules/@keyshade/cli/esbuild.config.js"
    rm -f "$pkgdir/usr/lib/node_modules/@keyshade/cli/tsconfig.json"
    rm -f "$pkgdir/usr/lib/node_modules/@keyshade/cli/tsup.config.ts"
}

# To get the correct checksum, run:
# curl -s https://registry.npmjs.org/@keyshade/cli/-/cli-3.0.2.tgz | sha256sum
