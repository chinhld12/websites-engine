// Use simple-git to clone the repository to the `content` directory
import simpleGit from 'simple-git';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

function cloneRepository() {
  const git = simpleGit();
  const repoUrl = process.env.REPO_CONTENT;
  const contentPath = path.join(process.cwd(), 'content');
  const options = {
    '--depth': '1', // Clone only the latest commit
    '--single-branch': null, // Clone only the default branch
  };
  // Check if the content directory already exists
  if (repoUrl) {
    // Check if the content directory exists and has content
    if (
      fs.existsSync(contentPath) &&
      fs.readdirSync(contentPath, { withFileTypes: true }).length > 0
    ) {
      // Check if it's a git repository
      if (fs.existsSync(path.join(contentPath, '.git'))) {
        console.log(
          'Content directory already exists and is a git repository.',
        );
        // Pull the latest changes
        git.cwd(contentPath).pull((err, update) => {
          if (err) {
            console.error('Error pulling latest changes:', err);
          } else if (update && update.summary.changes) {
            console.log('Pulled latest changes:', update.summary.changes);
          } else {
            console.log('No changes to pull.');
          }
        });
        return;
      }
    } else {
      // Clone the repository
      git.clone(repoUrl, contentPath, options, err => {
        if (err) {
          console.error('Failed to clone repository:', err);
          process.exit(1);
        } else {
          console.log('Repository cloned successfully to', contentPath);
        }
      });
    }
  } else {
    console.error('REPO_CONTENT environment variable is not set.');
    process.exit(1);
  }
}

cloneRepository();
