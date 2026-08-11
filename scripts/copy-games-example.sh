#!/usr/bin/env bash
set -euo pipefail

# Run this from the folder that contains party-games, imposter-who, quiz-shooter, and build-a-beast.

rsync -av --delete --exclude node_modules --exclude .git "./imposter-who/" "./party-games/apps/imposter/"
rsync -av --delete --exclude node_modules --exclude .git "./quiz-shooter/" "./party-games/apps/quiz-shooter/"
rsync -av --delete --exclude node_modules --exclude .git "./build-a-beast/" "./party-games/apps/build-a-beast/"

echo "Done copying games into party-games/apps/."
