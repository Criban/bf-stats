# Blackhawk layered breathing animation

Created with the built-in `image_gen` tool. Source: `../8lackh4wk-aiming-soldier.png` (preserved).

Four transparent 1024 × 1536 PNGs: `legs.png`, `torso.png`, `head.png`, `arms-weapon.png`.
The SVG image rectangles in `src/app/soldiers/soldier-portrait/soldier-portrait.component.html` align the generated parts with the original pose. Legs stay fixed. The torso expands and lifts; the head follows; both arms and the rifle move as one connected layer so the hands keep their grips. The 5.2-second cycle is offset from Criban. Reduced motion disables animation. Lighting matches the hangar, including the selected state.

## Prompt set

Common prompt (substitute the part and request below):

Use case: precise-object-edit. Input image is the edit target. Asset type: transparent photorealistic 2D soldier animation layer. Canvas 1024x1536, identical to source. Extract {part}: {request} CRITICAL: keep original visible pixel positions, size, silhouette, perspective, photographic detail and lighting of the retained body parts. This is an aligned layer, not a close-up product shot: leave the original empty canvas margins intact; do not zoom, crop, center or move the parts. Preserve the original black uniform, helmet, goggles and equipment identity. All removed pixels must be truly transparent alpha, no background, no glow, no painted checkerboard, no cast shadows. Only reconstruct hidden joint overlaps. No text or labels.

### legs

Retain ONLY belt, pelvis, both legs, leg-mounted pouches and boots, from y=595 down to y=1495. Remove head, torso, both arms and rifle. Reconstruct fabric at the waist to extend 30 pixels behind the torso layer. Exact original leg pose and stance.

### torso

Retain ONLY torso including neck fabric, shoulder straps, armored vest, magazines and waist pouch, approximately x=295..655,y=200..650. Remove helmet/head, both arms, hands, entire rifle and legs. Inpaint the complete vest and shirt behind removed rifle and forearms, matching existing armor and black fabric. Include filled shoulder sockets and 30px neck/waist overlap.

### head

Retain ONLY helmet, headset, goggles, covered face and neck, approximately x=350..580,y=30..265. Remove body, arms, rifle and legs. Complete the lower black neck fabric that was hidden by the rifle, extending to y=275 for overlap.

### arms-weapon

Retain ONLY BOTH complete arms, their hands and the ENTIRE rifle including stock, sights, magazine and suppressor as ONE connected layer. Exact reference aiming pose, same rifle angle, same hand grips. Arms from both shoulders through elbows to hands, approximately x=235..835,y=210..495, rifle approximately x=370..1005,y=165..425. Remove torso, head, legs and background; the space between bent arms is transparent. Do NOT include any vest, waist pouches, chest fabric or floating body remnants. Add small black shoulder fabric overlaps at arm roots.
