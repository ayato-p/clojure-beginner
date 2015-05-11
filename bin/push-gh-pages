#!/bin/sh

# usage: push-gh-pages DIRECTORY # DIRECTORY is where GitHub pages contents are in (eg. build)

set -e

remote=$(git config remote.origin.url)
described_rev=$(git rev-parse HEAD | git name-rev --stdin)

pages_dir="$1"

if [ ! -d "$pages_dir" ]
then
    echo "Usage: $0 DIRECTORY"
    exit 1
fi

cd "$pages_dir"

cdup=$(git rev-parse --show-cdup)
if [ "$cdup" != '' ]
then
    git init
    git remote add --fetch origin "$remote"
fi

if git rev-parse --verify origin/gh-pages > /dev/null 2>&1
then
    git checkout gh-pages
else
    git checkout --orphan gh-pages
fi

git add .
git commit -m "pages built at $described_rev" -e
git push origin gh-pages