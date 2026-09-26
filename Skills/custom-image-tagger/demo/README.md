# Custom Image Tagger — Demo Content

Demo content for the [custom-image-tagger](../) skill. Use these sample files to set up a working demo of the skill in SharePoint.

## What's included

The `sample-files/` folder contains 8 images related to construction pictures 

## Setup

1. Create or open a SharePoint document library.
2. Upload all images from `sample-files/` into the library.
3. Install the [custom-image-tagger](../) skill into your SharePoint Skills library (see the skill's README for install steps).
4. Select one or more images
5. From a Copilot agent, prompt: *"Tag these images"*

## What to expect

The agent will:
- If missing, the skill will create 'Primary Objects' and 'Background Objects' columns in the library
- Read each image and extract primary objects and background objects as comma deliminated strings
- Store the output into primary objects and background objects columns respectively
- Enable end user search by objects
- Enable Copilot reasoning of images by objects

## Watch demo on YouTube

[![Custom Image Tagger Demo](../assets/preview.png)](https://youtu.be/JcQXUEMirKU)
