#!/bin/bash

# Check if a version is passed as an argument
if [ -z "$1" ]; then
    echo "Usage: $0 <version> <release_type>"
    exit 1
fi

# Check if a release type is passed as an argument
if [ -z "$2" ]; then
    echo "Usage: $0 <version> <release_type>"
    exit 1
fi

# Get the release type
release_type=$2

# Check if the release type is valid
if [ "$release_type" != "alpha" ] && [ "$release_type" != "release" ]; then
    echo "Invalid release type. Valid release types are 'alpha' and 'release'"
    exit 1
fi

# Check if the current branch is main
if [ "$(git branch --show-current)" != "main" ]; then
    echo "You must be on the main branch to release a new version"
    exit 1
fi

# Get the version based on the release type
version=$1
if [ "$release_type" == "alpha" ]; then
    version="$version-alpha"
fi

echo "Releasing version $version"

# Update version in package.json
echo "Updating version in package.json"
sed -i "s/\"version\": \".*\"/\"version\": \"$version\"/g" package.json

# Generate the CHANGELOG.md
echo "Generating CHANGELOG.md"
pnpm run changelog

# Commit the changes
echo "Committing the changes"
git add CHANGELOG.md package.json
git commit -m "chore(release): $version"

# Tag the release
echo "Tagging the release"
git tag $version

# Push the changes
echo "Pushing the changes to main"
git push origin main --tags

# Switch to alpha branch if the release type is alpha
# else switch to release branch
echo "Switching to $release_type branch"
git checkout $release_type

# Rebase main branch
echo "Rebasing main branch"
git rebase main

# Push the changes
echo "Pushing the changes to $release_type"
git push origin $release_type --tags
