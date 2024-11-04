#!/bin/bash

# Define colors for readability
RED_BOLD="\033[1;31m"
BLUE_BOLD="\033[1;34m"
YELLOW_BOLD="\033[1;33m"
CYAN_BOLD="\033[1;36m"
MAGENTA="\033[1;35m"
GREEN_BOLD="\033[1;32m"
RESET="\033[0m"

filePath="$1"

if [ -z "$filePath" ]; then
  printf "${RED_BOLD}Error: No file path provided. Please specify the file you want to process (TypeScript or JavaScript).${RESET}\n"
  exit 1
fi

if [[ "$filePath" != *"/lwc/"* || ( "$filePath" != *.ts && "$filePath" != *.js ) ]]; then
  printf "${RED_BOLD}Error: The specified file must be a TypeScript or JavaScript file in the 'lwc' directory.${RESET}\n"
  exit 1
fi

fileName=$(basename "$filePath")
componentName="${fileName%.*}"  # Remove file extension for component name
jsFilePath="${filePath%.ts}.js"  # Path to JavaScript file (for both cases)
componentFolder=$(dirname "$filePath")

printf "${CYAN_BOLD}Starting pre-deploy process for:${RESET} %s\n" "$fileName"

if [[ "$filePath" == *.ts ]]; then
  # Step 1: Compile all TypeScript files
  printf "${CYAN_BOLD}Step 1:${RESET} Compiling all ${BLUE_BOLD}TypeScript${RESET} files in the project\n"
  start_time=$(date +%s)
  npx tsc --project ./force-app/main/default/lwc
  end_time=$(date +%s)
  printf "${MAGENTA}Completed in %d seconds.${RESET}\n" "$((end_time - start_time))"
  
  # Step 2: Lint the TypeScript file
  printf "${CYAN_BOLD}Step 2:${RESET} Linting the ${BLUE_BOLD}TypeScript${RESET} source file: ${MAGENTA}%s${RESET}\n" "$fileName"
  start_time=$(date +%s)
  npx eslint --fix "$filePath"
  end_time=$(date +%s)
  if [ $? -ne 0 ]; then
    printf "${RED_BOLD}ESLint error: Issues found in %s. Fix the errors and try again.${RESET}\n" "$fileName"
    exit 1
  fi
  printf "${MAGENTA}Completed in %d seconds.${RESET}\n" "$((end_time - start_time))"
  
  # Step 3: Lint the generated JavaScript file
  printf "${CYAN_BOLD}Step 3:${RESET} Linting the ${YELLOW_BOLD}JavaScript${RESET} file: ${MAGENTA}%s.js${RESET}\n" "$componentName"
  start_time=$(date +%s)
  npx eslint --fix "$jsFilePath"
  end_time=$(date +%s)
  if [ $? -ne 0 ]; then
    printf "${RED_BOLD}ESLint error: Issues found in %s.js. Fix the errors and try again.${RESET}\n" "$componentName"
    exit 1
  fi
  printf "${MAGENTA}Completed in %d seconds.${RESET}\n" "$((end_time - start_time))"
  
  # Step 4: Format the JavaScript file with Prettier
  printf "${CYAN_BOLD}Step 4:${RESET} Formatting with Prettier: ${MAGENTA}%s.js${RESET}\n" "$componentName"
  start_time=$(date +%s)
  npx prettier --write "$jsFilePath"
  end_time=$(date +%s)
  if [ $? -ne 0 ]; then
    printf "${RED_BOLD}Prettier error: Issues found in %s.js. Fix the errors and try again.${RESET}\n" "$componentName"
    exit 1
  fi
  printf "${MAGENTA}Completed in %d seconds.${RESET}\n" "$((end_time - start_time))"
fi

# Step 5 (or Step 1 if .js): Deploy the component to Salesforce
printf "${CYAN_BOLD}Step %s:${RESET} Deploying component to Salesforce from folder: ${MAGENTA}%s${RESET}\n" "$([[ "$filePath" == *.ts ]] && echo "5" || echo "1")" "$componentFolder"
start_time=$(date +%s)
sf project deploy start --source-dir "$componentFolder"
end_time=$(date +%s)
if [ $? -ne 0 ]; then
  printf "${RED_BOLD}Deployment error: Something went wrong during deployment.${RESET}\n"
  exit 1
fi
printf "${GREEN_BOLD}Deployment successful!${RESET} ${MAGENTA}Completed in %d seconds.${RESET}\n" "$((end_time - start_time))"
