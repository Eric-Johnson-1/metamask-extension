import { isObject } from '@metamask/utils';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error pipeline() isn't defined as part of @types/readable-stream
import { pipeline, Duplex } from 'readable-stream';

class Substream extends Duplex {
  parent: Duplex;

  constructor(parent: Duplex) {
    super({ objectMode: true });
    this.parent = parent;
  }

  _read() {
    return undefined;
  }

  _write(
    value: unknown,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    this.parent.push({
      type: 'caip-348',
      data: value,
    });
    callback();
  }
}

export class CaipStream extends Duplex {
  substream: Duplex;

  constructor() {
    super({ objectMode: true });
    this.substream = new Substream(this);
  }

  _read() {
    return undefined;
  }

  _write(
    value: unknown,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    if (isObject(value) && value.type === 'caip-348') {
      this.substream.push(value.data);
    }
    callback();
  }
}

/**
 * Creates a pipeline using a port stream meant to be consumed by the JSON-RPC engine:
 * - accepts only incoming CAIP messages intended for evm providers from the port stream
 * - unwraps these incoming messages into a new stream that the JSON-RPC engine should operate off
 * - wraps the outgoing messages from the new stream back into the CAIP message format
 * - writes these messages back to the port stream
 *
 * @param portStream - The source and sink duplex stream
 * @returns a new duplex stream that should be operated on instead of the original portStream
 */
export const createCaipStream = (portStream: Duplex): Duplex => {
  const caipStream = new CaipStream();

  /** Cleanly end the CAIP side if the port goes away. */
  const handlePortGone = () => {
    // End only once
    if (
      !caipStream.substream.destroyed &&
      !caipStream.substream.writableEnded
    ) {
      caipStream.substream.end();
    }
  };

  // 1. Listen for tab/iframe shutdown signals
  // a. Node-style streams emit 'close' and/or 'end'
  portStream.once?.('close', handlePortGone);
  portStream.once?.('end', handlePortGone);

  // b. chrome.runtime.Port exposes onDisconnect
  //    (ExtensionPortStream exposes the raw Port at `._port`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawPort: chrome.runtime.Port | undefined = (portStream as any)?._port;
  rawPort?.onDisconnect?.addListener(handlePortGone);

  // 2. Wire up the full duplex pipeline
  pipeline(portStream, caipStream, portStream, (err: Error | null) => {
    caipStream.substream.destroy();

    if (err && err.message !== 'Premature close') {
      console.error('MetaMask CAIP stream error:', err);
    }
  });

  return caipStream.substream;
};
