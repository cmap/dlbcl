[![CMap Logo](//assets.clue.io/clue/public/img/logos/cmap-logo-cntrd.png)](https://clue.io)

# Introduction
Node.js application for CLUE web apps

## Website Links
* [Development](https://dev.clue.io) (developer access only)
* [Sandbox](https://sandbox.clue.io) (Clue team access only)
* [QA](https://qa.clue.io) (admin access only)
* [Production](https://clue.io)
* [Jenkins tests](https://jenkins.clue.io/)

# Table of Contents
* [Installation/Quickstart Guide](#installationquickstart-guide)
* [Directory Structure](#directory-structure)
* [Usage](#usage)
* [Deployment](#deployment)
* [Update Touchstone Cache](#update-touchstone-cache)
* [Compiling Command to bundle.js](#compiling-command-to-bundlejs)

# Installation/Quickstart Guide

## Prerequisites

Before starting to build and install kafejo from source, you will need the following installed:
* [Node](https://nodejs.org/en/)
* [npm](https://www.npmjs.com/)
* [Grunt](http://gruntjs.com/)
* [Sass](http://sass-lang.com/)

## Check code out of github
Use git to clone the kafejo repository locally.

```bash
git clone https://github.com/cmap/dlbcl.git
```
In the following, we'll refer to the checked out directory(kafejo) as $KAFEJO_CHECKOUT

## Install the Kafejo dependencies using npm
This only has to be done once

```bash
cd  $KAFEJO_CHECKOUT
npm install
```
In a browser, navigate to ``` http://localhost:9090 ``` to view the web app:


[Back To Top](#table-of-contents)