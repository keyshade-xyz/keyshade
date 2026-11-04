#!/bin/bash

# Test script for enhanced Keyshade CLI configuration system
# This demonstrates the new features without requiring a full build

echo "=== Keyshade CLI Enhanced Configuration Test ==="
echo

# Test 1: Create sample configuration files
echo "1. Creating sample configuration files..."

# Basic configuration with environment variables
cat > keyshade.json << 'EOF'
{
  "workspace": "${KEYSHADE_WORKSPACE:-default-workspace}",
  "project": "${KEYSHADE_PROJECT:-my-project}",
  "environment": "${NODE_ENV:-development}",
  "quitOnDecryptionFailure": false
}
EOF

# Multi-profile configuration
cat > keyshade-profiles.json << 'EOF'
{
  "workspace": "${KEYSHADE_WORKSPACE:-company}",
  "project": "${KEYSHADE_PROJECT:-app}",
  "environment": "development",
  "quitOnDecryptionFailure": false,
  "profiles": {
    "dev": {
      "environment": "development",
      "quitOnDecryptionFailure": false
    },
    "staging": {
      "environment": "staging",
      "quitOnDecryptionFailure": true
    },
    "prod": {
      "environment": "production",
      "quitOnDecryptionFailure": true
    }
  }
}
EOF

# Global configuration
mkdir -p ~/.keyshade
cat > ~/.keyshade/global-config.json << 'EOF'
{
  "workspace": "global-default",
  "quitOnDecryptionFailure": false
}
EOF

echo "✓ Created sample configuration files"

# Test 2: Show configuration examples
echo
echo "2. Configuration Examples:"
echo

echo "Basic keyshade.json:"
cat keyshade.json
echo

echo "Multi-profile keyshade-profiles.json:"
cat keyshade-profiles.json
echo

echo "Global config ~/.keyshade/global-config.json:"
cat ~/.keyshade/global-config.json
echo

# Test 3: Show environment variable examples
echo "3. Environment Variable Examples:"
echo

echo "Set these environment variables to test interpolation:"
echo "export KEYSHADE_WORKSPACE=my-workspace"
echo "export KEYSHADE_PROJECT=my-project"
echo "export NODE_ENV=production"
echo

# Test 4: Show CLI usage examples
echo "4. CLI Usage Examples:"
echo

echo "# Auto-discover configuration (looks for keyshade.json in current/parent dirs)"
echo "keyshade run npm start"
echo

echo "# Use specific configuration file"
echo "keyshade run --config-file keyshade-profiles.json npm start"
echo

echo "# Use profile from configuration"
echo "keyshade run --config-file keyshade-profiles.json --profile prod npm start"
echo

echo "# Override with command line flags"
echo "keyshade run --workspace custom --environment staging npm start"
echo

echo "# Dry run to see resolved configuration"
echo "keyshade run --dry-run npm start"
echo

echo "# Debug configuration resolution"
echo "keyshade run --debug-config npm start"
echo

echo "# Non-interactive mode for CI"
echo "keyshade run --no-interactive npm start"
echo

# Test 5: Show config management commands
echo "5. Configuration Management Commands:"
echo

echo "# Initialize new configuration file"
echo "keyshade config init"
echo "keyshade config init --template production"
echo "keyshade config init --template multi-profile"
echo

echo "# Validate configuration"
echo "keyshade config validate"
echo "keyshade config validate --config-file keyshade-profiles.json --profile staging"
echo

echo "# Set global defaults"
echo "keyshade config global"
echo

echo "# Show resolved configuration with debug info"
echo "keyshade config validate --debug-config"
echo

# Test 6: Show precedence order
echo "6. Configuration Precedence Order (highest to lowest):"
echo "   1. Command line flags (--workspace, --project, --environment)"
echo "   2. Profile configuration (--profile)"
echo "   3. Local config files (keyshade.json)"
echo "   4. Global configuration (~/.keyshade/global-config.json)"
echo

# Test 7: Show auto-discovery example
echo "7. Auto-Discovery Example:"
echo

# Create a subdirectory structure
mkdir -p project/src/components
cd project/src/components

echo "# Even from deep subdirectories, the CLI will find keyshade.json in parent dirs"
echo "# Current directory: $(pwd)"
echo "# Will find: ../../../keyshade.json"
echo "keyshade run npm test"

cd ../../..

echo
echo "=== Test Complete ==="
echo
echo "The enhanced configuration system provides:"
echo "✓ Config file auto-discovery"
echo "✓ Environment variable interpolation (\${VAR} syntax)"
echo "✓ Multiple config file merging"
echo "✓ Interactive configuration prompts"
echo "✓ Enhanced validation with specific error messages"
echo "✓ Profile-based configs"
echo "✓ Global config override support"
echo "✓ Configuration debugging"
echo "✓ Dry-run mode"
echo "✓ Non-interactive mode for CI"
echo

echo "Next steps:"
echo "1. Build the CLI: cd apps/cli && npm run build"
echo "2. Test with real configuration: keyshade config init"
echo "3. Validate setup: keyshade config validate"
echo "4. Run with your application: keyshade run <your-command>"
