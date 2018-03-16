# Mandelbrot-Set-Render
A real-time, GPU accelerated Javascript Mandelbrot-Set render. [Try it here](https://bewelge.github.io/Mandelbrot-Set-Render/)

![Image of Mandelbrotset](https://github.com/Bewelge/Mandelbrot-Set-Render/blob/master/img/Mandelbrot.png)

### What it does

* Computes and renders the [Mandelbrot set](https://en.wikipedia.org/wiki/Mandelbrot_set) in real-time. 
* Click to move the position of your screen
* Zoom by scrolling up or down on the Canvas.
* Modify the amount of iterations (results in higher detail)

### How it works

The program is built upon GPU.js which allows the creation of Kernels that are executed on a computers GPU. 

Each kernel computes the divergence for one pixel and outputs a color according to the result.

### Libaries
* jQuery
* [GPU.js](gpu.rocks) - Allows parallel computation of the Mandelbrot set.
* [QuickSettings.js - Settings Menu](https://github.com/bit101/quicksettings)
