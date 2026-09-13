# The nervous system

The nervous system is the service that connects $AMPHOOD on-chain activity to the organism.

It watches the chain, detects relevant $AMPHOOD activity, converts those events into sensory stimuli, and broadcasts them to the live simulation.

The chain does not tell the organism what to do.

It only disturbs its world.

```text
$AMPHOOD activity
        ↓
chain listener
        ↓
stimulus engine
        ↓
sensory input
        ↓
nervous system
        ↓
organism response
```

There is no second token and no external feed.

$AMPHOOD is the environment.

## How it works

The listener watches $AMPHOOD activity in real time.

Relevant events are normalized and translated into biological-style stimuli.

Examples:

```text
$AMPHOOD buy
→ chemical stimulus

large $AMPHOOD buy
→ strong chemical stimulus

$AMPHOOD sell
→ mechanical disturbance

large $AMPHOOD sell
→ strong mechanical disturbance

volume spike
→ vibration

rapid transaction burst
→ repeated sensory pulses

inactivity
→ decreasing environmental stimulation
```

Transaction size affects the intensity of the stimulus, not the final behavior of the organism.

The resulting stimulus is passed into the simulation.

```text
event
→ magnitude
→ stimulus type
→ stimulus intensity
→ nervous system
→ internal state change
→ behavior
```

A buy does not simply trigger an "approach" animation.

A sell does not simply trigger a "recoil" animation.

The event determines the input.

The organism's current internal state determines the response.

## One-time setup (Windows, PowerShell)

Node must be installed on the machine.

In PowerShell:

```powershell
cd D:\ClaudeCode\amphood\nervous-system
npm install
```

Create:

```text
D:\ClaudeCode\amphood\nervous-system\.env
```

Add the required environment variables:

```env
RPC_URL=
AMPHOOD_CONTRACT_ADDRESS=
```

Do not commit `.env`.

Add `.env` to `.gitignore`.

After $AMPHOOD launches, add the contract configuration to `config.json`.

Example:

```json
{
  "amphood": {
    "address": "",
    "launchBlock": 0
  }
}
```

The contract address and launch block should always be configurable.

Do not hardcode them into the listener.

## Run

Start the chain listener:

```powershell
cd D:\ClaudeCode\amphood\nervous-system
node listener.js
```

Run without broadcasting stimuli:

```powershell
node listener.js --dry
```

Check the current system state:

```powershell
node status.js
```

Watch incoming events:

```powershell
node listener.js --verbose
```

## Stimulus engine

Raw blockchain activity should never be sent directly to the organism.

Every event first passes through the stimulus engine.

A normalized stimulus should look approximately like this:

```json
{
  "type": "CHEMICAL",
  "intensity": 0.42,
  "source": "ONCHAIN",
  "timestamp": 0
}
```

Supported stimulus types can include:

```text
CHEMICAL
MECHANICAL
VIBRATION
TOUCH
PULSE
OVERLOAD
```

Intensity should normally be normalized between:

```text
0.0 → 1.0
```

Use logarithmic or otherwise bounded normalization for transaction magnitude.

One unusually large transaction must not break the simulation.

## The organism

Every active AMPHOOD session can maintain its own internal state.

Example:

```json
{
  "specimen": "AMP-0841",
  "energy": 0.62,
  "arousal": 0.31,
  "stress": 0.14,
  "neuralActivity": 0.27,
  "state": "EXPLORING"
}
```

All organisms may receive the same global on-chain stimulus.

They do not have to respond in the same way.

```text
GLOBAL STIMULUS
      ↓
 ┌────┼────┐
 ↓    ↓    ↓
A     B    C
↓     ↓    ↓
different internal states
↓     ↓    ↓
different responses
```

This distinction is fundamental to AMPHOOD.

The blockchain determines what enters the environment.

The nervous system determines what happens next.

## Idle behavior

The organism must remain alive even when nothing happens on-chain.

No transactions should be fabricated to keep the visualization active.

Instead, the simulation has its own baseline behavior.

Possible states include:

```text
RESTING
DRIFTING
EXPLORING
PAUSED
ALERT
APPROACHING
AVOIDING
```

A quiet chain means a quiet environment.

It does not mean a dead organism.

## Local stimuli

Not every stimulus needs to come from the blockchain.

For example, clicking inside the tank can create a local touch stimulus:

```json
{
  "type": "TOUCH",
  "intensity": 0.5,
  "source": "USER",
  "x": 0.48,
  "y": 0.71
}
```

Only nearby organisms should receive local stimuli.

These interactions are simulation-only.

They do not create transactions and do not require a wallet.

## Event log

Every detected on-chain event and generated stimulus should be written to a public-readable event log.

Example:

```json
{
  "block": 0,
  "txHash": "",
  "event": "BUY",
  "stimulus": "CHEMICAL",
  "intensity": 0.42,
  "timestamp": 0
}
```

The website can use this data to display the recent history of the organism's environment.

The log should describe what actually happened.

Do not generate fake chain activity for the production event feed.

## Architecture

The intended architecture is:

```text
Robinhood Chain / RPC
        ↓
$AMPHOOD listener
        ↓
event classifier
        ↓
stimulus engine
        ↓
global event stream
        ↓
simulation
        ↓
organism state
        ↓
live observatory
```

The server is responsible for:

- observing the chain
- validating events
- generating standardized stimuli
- maintaining global timestamps
- broadcasting global events
- tracking active sessions

The browser is responsible for:

- rendering organisms
- smooth movement
- interpolation
- particles
- local simulation
- local touch interactions
- visualization

Do not send animation frames through the server.

Broadcast events and state changes.

Let the browser render the movement.

## Safety

- Never commit private keys, RPC secrets, or `.env`.
- The observer does not need custody of user funds.
- Reading blockchain activity should not require a private key.
- Wallet connection should not be required simply to observe the organism.
- Local tank interactions must never silently create transactions.
- Contract addresses and chain configuration must remain configurable.
- Every production on-chain event shown by the observatory should be traceable to a real transaction.
- Simulation events and blockchain events must remain clearly distinguishable.

## Before launch

Before connecting the production $AMPHOOD contract:

1. Run the listener in dry mode.
2. Verify event classification.
3. Verify transaction magnitude normalization.
4. Verify stimulus intensity limits.
5. Test reconnects and duplicate events.
6. Test chain reorg handling.
7. Test WebSocket/RPC failures.
8. Verify that the simulation continues during chain inactivity.
9. Verify that no private key is required for read-only operation.
10. Connect the production contract only after the event pipeline is stable.

## Philosophy

AMPHOOD does not understand markets.

It does not know what a buy is.

It does not know what a sell is.

It experiences chemical signals, vibration, pressure, disturbance, and silence.

The blockchain creates the environment.

The nervous system experiences it.

The organism responds.

**The chain doesn't control the organism. It disturbs its world.**
