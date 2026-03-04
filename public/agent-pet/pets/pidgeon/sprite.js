export const pidgeonSprite = {
  "name": "Pidgeon",
  "frameDuration": 6,
  "atlas": {
    "src": "/agent-pet/pets/pidgeon/media/sheet.png",
    "scale": 2,
    "facing": "right"
  },
  "shadow": {
    "groundOffset": 1,
    "groundWidthPad": 14,
    "airborneOffset": 14,
    "airborneWidthPad": 4,
    "airborneActions": [
      "Flight",
      "Flap",
      "Glide",
      "Glide 2"
    ]
  },
  "animations": {
    "flight": {
      "title": "Flight",
      "category": "movement",
      "playable": true,
      "frameCount": 4,
      "totalTicks": 24,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 96,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Flight",
          "actionKey": "flight",
          "category": "movement"
        },
        {
          "x": 32,
          "y": 96,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Flight",
          "actionKey": "flight",
          "category": "movement"
        },
        {
          "x": 64,
          "y": 96,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Flight",
          "actionKey": "flight",
          "category": "movement"
        },
        {
          "x": 96,
          "y": 96,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Flight",
          "actionKey": "flight",
          "category": "movement"
        }
      ]
    },
    "idle": {
      "title": "Idle",
      "category": "idle",
      "playable": true,
      "frameCount": 4,
      "totalTicks": 24,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 0,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle",
          "actionKey": "idle",
          "category": "idle"
        },
        {
          "x": 32,
          "y": 0,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle",
          "actionKey": "idle",
          "category": "idle"
        },
        {
          "x": 64,
          "y": 0,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle",
          "actionKey": "idle",
          "category": "idle"
        },
        {
          "x": 96,
          "y": 0,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle",
          "actionKey": "idle",
          "category": "idle"
        }
      ]
    },
    "movement": {
      "title": "Movement",
      "category": "movement",
      "playable": true,
      "frameCount": 4,
      "totalTicks": 24,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 32,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement",
          "actionKey": "movement",
          "category": "movement"
        },
        {
          "x": 32,
          "y": 32,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement",
          "actionKey": "movement",
          "category": "movement"
        },
        {
          "x": 64,
          "y": 32,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement",
          "actionKey": "movement",
          "category": "movement"
        },
        {
          "x": 96,
          "y": 32,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement",
          "actionKey": "movement",
          "category": "movement"
        }
      ]
    },
    "peck": {
      "title": "Peck",
      "category": "interaction",
      "playable": true,
      "frameCount": 4,
      "totalTicks": 24,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 64,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Peck",
          "actionKey": "peck",
          "category": "interaction"
        },
        {
          "x": 32,
          "y": 64,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Peck",
          "actionKey": "peck",
          "category": "interaction"
        },
        {
          "x": 64,
          "y": 64,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Peck",
          "actionKey": "peck",
          "category": "interaction"
        },
        {
          "x": 96,
          "y": 64,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Peck",
          "actionKey": "peck",
          "category": "interaction"
        }
      ]
    }
  },
  "animationOrder": [
    "flight",
    "idle",
    "movement",
    "peck"
  ],
  "defaultAnimationKeys": {
    "idle": "idle",
    "movement": "flight",
    "interaction": "peck",
    "celebration": "flight"
  },
  "frames": [
    {
      "x": 0,
      "y": 96,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Flight",
      "actionKey": "flight",
      "category": "movement"
    },
    {
      "x": 32,
      "y": 96,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Flight",
      "actionKey": "flight",
      "category": "movement"
    },
    {
      "x": 64,
      "y": 96,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Flight",
      "actionKey": "flight",
      "category": "movement"
    },
    {
      "x": 96,
      "y": 96,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Flight",
      "actionKey": "flight",
      "category": "movement"
    },
    {
      "x": 0,
      "y": 0,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Idle",
      "actionKey": "idle",
      "category": "idle"
    },
    {
      "x": 32,
      "y": 0,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Idle",
      "actionKey": "idle",
      "category": "idle"
    },
    {
      "x": 64,
      "y": 0,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Idle",
      "actionKey": "idle",
      "category": "idle"
    },
    {
      "x": 96,
      "y": 0,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Idle",
      "actionKey": "idle",
      "category": "idle"
    }
  ]
};
