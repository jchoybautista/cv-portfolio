#!/usr/bin/env bash
# -------------------------------------------------------
# Claude Code skills installer — Jonathan Bautista
# Run once on any new device:  bash setup-skills.sh
# -------------------------------------------------------

set -e

echo ""
echo "Installing Claude Code skills..."
echo ""

echo "[1/6] UI UX Pro Max"
npx skills add nextlevelbuilder/ui-ux-pro-max-skill -g -a claude-code -s '*' -y

echo "[2/6] Taste Skill"
npx skills add Leonxlnx/taste-skill -g -a claude-code -s '*' -y

echo "[3/6] Impeccable"
npx impeccable install -g

echo "[4/6] Remotion"
npx skills add remotion-dev/skills -g -a claude-code -s '*' -y

echo "[5/6] skillui CLI"
npm install -g skillui

echo "[6/6] web-design-guidelines (project-local)"
npx -y skills add vercel-labs/agent-skills --skill web-design-guidelines --agent claude-code

echo ""
echo "-------------------------------------------------------"
echo "TypeUI MCP must be set up manually (requires sign-in):"
echo ""
echo "  claude mcp add --scope user --transport http typeui https://mcp.typeui.sh/mcp"
echo ""
echo "Then open Claude Code → run /mcp → select typeui → sign in."
echo "-------------------------------------------------------"
echo ""
echo "All done!"
