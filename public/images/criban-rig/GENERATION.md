# Criban layered breathing prototype

Created with the built-in `image_gen` tool from `../criban-gasmask-soldier.png`.
The source is preserved. Each PNG has a transparent alpha channel on a 1024 × 1536 canvas.
The generated parts differ in scale and placement; SVG image rectangles in
`src/app/soldier-portrait.component.ts` align them with the original pose.

Layers: `legs.png`, `torso.png`, `head.png`, `arm-left.png`, `arm-right.png`.
Left/right refer to the viewer's perspective. The rifle belongs to `arm-left.png`.
Legs stay fixed. Torso, head and arms animate on a 4.8-second cycle. Reduced motion
disables all four animations. Other soldiers use their original static images.

## Prompt set

Each asset used the following common prompt with the part name and request below:

> Use case: precise-object-edit. Edit target: provided soldier image. Asset type: ONE aligned transparent PNG layer for a 2D skeletal breathing animation. Output canvas EXACTLY 1024x1536 portrait. Extract {part}. {request} CRITICAL: preserve the source soldier identity, photographic texture, lighting, orange buckles and black tactical fabric. Preserve EXACT original size and pixel positions of retained body part on the full 1024x1536 canvas, do not center, reposition, enlarge or crop the part. All removed areas and background must be truly transparent alpha, no black backdrop, no checkerboard painted into image, no shadows outside the retained piece. Preserve all existing visible detail, only inpaint small hidden joint overlap areas. No text, no labels, no additional body parts. This output is a single animation layer to be composited at 0,0 over other same-sized layers.

### legs

Only the lower body from the belt at y=600 down to both boots at y=1505, including belt, pelvis, trousers, knee pads, holster and leg-mounted pouches. Remove all upper body, head, both arms and the handheld rifle. Reconstruct the pelvis behind overlapping hands and pouches. Upper edge should extend up to y=570 for overlap.

### torso

Only the torso, neck scarf, shoulder harness and armored vest including attached magazines and pouches, spanning approximately x=315..690 and y=215..650. Remove head, both arms, rifle and legs. Reconstruct fabric behind removed arms. Leave rounded filled shoulder sockets and 30 pixels of extra fabric overlap at shoulders and waist.

### head

Only the complete head with helmet, goggles, gas mask and neck down to y=275, positioned exactly at original x and y, including small neck overlap. Remove body, arms, legs, rifle and background.

### arm-left

Only the arm on the LEFT SIDE OF THE IMAGE (the soldier's right arm), from shoulder near x=365,y=260 down to the glove at x=235,y=780 AND the rifle held by that hand down to y=1035. Keep arm, hand and rifle as ONE connected rigid piece. Remove head, torso, other arm and legs. Fill the upper shoulder behind the vest with matching fabric for seamless overlap.

### arm-right

Only the arm on the RIGHT SIDE OF THE IMAGE (the soldier's left arm), from shoulder near x=650,y=270 down to glove at x=825,y=825. Remove head, torso, other arm, rifle and legs. Fill the upper shoulder behind the vest with matching fabric for seamless overlap.

## Validation

The production build passed. Headless Chrome loaded all five PNGs, confirmed four
active animations with distinct transforms at rest and inhale, and confirmed zero
animations with reduced motion enabled. Desktop and mobile screenshots were
reviewed. Temporary inspection script and screenshots live in the ignored `tmp/` folder.
