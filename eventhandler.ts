import XDCC from './index'
import * as colors from 'colors/safe'
import { Job } from './@types/job'

class EventHandler {
  onConnect(self: XDCC): void {
    self.on('connected', () => {
      clearTimeout(self.connectionTimeout)
      for (const chan of self.chan) {
        self.join(chan)
      }
      if (self.verbose) {
        console.error(colors.bold(colors.green(`\u2713`)), `connected to: ${colors.yellow(self.host)}:${self.port}`)
      }
      self.__verb(2, 'green', `joined: [ ${colors.yellow(self.chan.join(`${colors.white(', ')}`))} ]`)
      self.emit('ready')
    })
  }

  onRequest(self: XDCC): void {
    self.on('request', (args: { target: string; packets: number[] }) => {
      const candidate = self.__getCandidate(args.target)
      candidate.now = args.packets[0]
      self.__removeCurrentFromQueue(candidate)
      self.say(args.target, `xdcc send ${candidate.now}`)
      this.predefinedVerbose(self, candidate)
    })
  }

  onCtcpRequest(self: XDCC): void {
    self.on('ctcp request', (resp: { [prop: string]: string }): void => {
      self.__checkBeforeDL(resp, self.candidates[0])
    })
  }

  onNext(self: XDCC): void {
    self.on('next', (candidate: Job) => {
      candidate.timeout ? clearTimeout(candidate.timeout) : false
      candidate.retry = 0
      self.__removeCurrentFromQueue(candidate)
      if (candidate.queue.length) {
        candidate.now = candidate.queue[0]
        self.__removeCurrentFromQueue(candidate)
        self.say(candidate.nick, `xdcc send ${candidate.now}`)
        this.predefinedVerbose(self, candidate)
      } else {
        self.candidates = self.candidates.filter(c => c.nick !== candidate.nick)
        candidate.emit('done', candidate.show())
        self.emit('done', () => candidate.show())
        if (!self.candidates.length) {
          self.emit('can-quit')
        } else {
          const newcandidate = self.candidates[0]
          self.emit('request', { target: newcandidate.nick, packets: newcandidate.queue })
        }
      }
    })
  }

  private predefinedVerbose(self: XDCC, candidate: Job): void {
    candidate.timeout = self.__setupTimeout(
      [true, candidate.nick],
      {
        eventname: 'error',
        message: `timeout: no response from ${colors.yellow(candidate.nick)}`,
        padding: 6,
        candidateEvent: candidate,
      },
      1000 * 15,
      () => {
        self.__redownload(candidate)
      }
    )
    self.__verb(
      4,
      'green',
      `sending command: /MSG ${colors.yellow(candidate.nick)} xdcc send ${colors.yellow(candidate.now.toString())}`
    )
  }
}

export default new EventHandler()
