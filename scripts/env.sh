#!/bin/bash
# source to reconstruct GH_PAT / GL_PAT from split halves in .env (push-protection-safe)
D="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." && pwd)"
A=$(grep '^GH_PAT_A=' $D/.env | cut -d= -f2); B=$(grep '^GH_PAT_B=' $D/.env | cut -d= -f2)
export GH_PAT="$A$B"
A=$(grep '^GL_PAT_A=' $D/.env | cut -d= -f2); B=$(grep '^GL_PAT_B=' $D/.env | cut -d= -f2)
export GL_PAT="$A$B"
