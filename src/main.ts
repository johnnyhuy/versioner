import { argv, stdin, stdout, cwd, on, exit } from 'process'
import { deleteTags, getAllTags, getCurrentTag, tagVersion } from "./lib/git"
import { Command } from "commander"
import { bumpVersion } from "./lib/version"
import { debug, info, log, Logger, warn } from './lib/logger'
import { askConfirmation } from './lib/readline'

export async function main(args?: string[]) {
  args = args || argv

  const program = new Command()
  program
    .showHelpAfterError()

  program
    .enablePositionalOptions()
    .option('-d --debug', 'Show debugging messages')
    .hook('preAction', (thisCommand) => {
      if (thisCommand.opts().debug) {
        new Logger(true)
        debug('Debugging messages enabled!')
      }
    })

  program
    .command('apply')
    .description('Version this directory')
    .option('--dry-run, -D', 'Show a plan of changes')
    .option('--force -F', 'Run the command without confirmation')
    .action(async function () {
      let currentVersion = getCurrentTag(await getAllTags())
      let proposedVersion = "1.0.0"
      const dryRun = this.opts().D
      const force = this.opts().F

      if (currentVersion !== "") {
        proposedVersion = await bumpVersion(currentVersion)
      }

      if (dryRun) {
        warn('Dry-run enabled...')
      }

      log(`\n✅ Versioning this directory...`)
      info(`${cwd()}\n`)

      log(`🥾 Bumping version...`)
      info(`${currentVersion !== '' ? currentVersion : 'none'} -> ${proposedVersion}`)

      if (dryRun) {
        return
      }

      if (force) {
        await tagVersion(proposedVersion)
      } else {
        askConfirmation(async () => {
          await tagVersion(proposedVersion)
        })
      }
    })

  program
    .command('release')
    .description('Release version to third-party ecosystems')
    .option('--dry-run, -D', 'Show a plan of changes')
    .option('--force -F', 'Run the command without confirmation')
    .action(async function () {
      // TODO
    })

  program
    .command('purge')
    .description('Purge all versions from this directory')
    .option('--dry-run, -D', 'Show a plan of changes')
    .option('--force -F', 'Run the command without confirmation')
    .action(async function () {
      let versions = await getAllTags()
      const dryRun = this.opts().D
      const force = this.opts().F

      if (dryRun) {
        warn('Dry-run enabled...')
      }

      log(`\n✅ Versioning this directory...`)
      info(`${cwd()}\n`)

      if (versions.length === 0) {
        warn('No tags available to purge')
        return
      } else {
        log(`🥾 Deleting tags...`)
        info(versions.join(', '))
      }

      if (dryRun) {
        return
      }

      if (force) {
        await deleteTags(versions)
      } else {
        askConfirmation(async () => {
          await deleteTags(versions)
        })
      }
    })

  await program.parseAsync(args)
}
