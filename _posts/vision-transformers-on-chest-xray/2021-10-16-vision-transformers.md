---
layout: post
title:  "Vision Transformers on Chest Xray"
date:   2020-12-16 09:29:20 +0700
categories: jekyll update
image: kartavya.jpg
---

### Problem Statement 
With the uprise of COVID 19 cases in India, it becomes very essential to maintain social distance, find hotspots, contact tracing to find and contain the spread.



<figure>
<img src="{{ page.image }}">
<figcaption>Fig 1.Results of experiment</figcaption>
</figure>

We propose a AI based surveillance system, which feed input from the CCTV camera's in realtime and leverages transfer learning for being able to accurately predict areas where social distancing has been abandoned.

CCTV cameras - the algorithm runs on the live feed, and predicts the number of people in a frame. The threshold for people allowed in a particular place is to be determined by the zone of the area ( red/ orange/green) { This is yet to be done} Accordingly, a set Trigger alarm will be raised whenever the threshold is crossed. The alerts can include but not limited to -
Email
Daily Logs
Monitor Alert
Which will defintely help the local authorities to take cognizance of the incident. This will remove the manual need for viewing the footage.

Models with various precisions can be implemented, once trained on the India data set. However, due to the lack of resources, for the demo we've used a a pretrained YOLOv3 or this problem statement.

On the existing approach, we can apply a detector to see the count for people wearing masks in a region as well. Which will help give more dynamics of the situtation to the local authorities.

A IAAS ( IDentity as a Service) layer can very well be applied to the output layer, to help identify people.

Satelitie Imagery - We propose to run the same model for satelite imagery as well, which will follow similar steps in case a law breaking situtation arises.
The resouces that have helped us -

[https://www.analyticsvidhya.com/blog/2019/02/building-crowd-counting-model-python/](https://www.analyticsvidhya.com/blog/2019/02/building-crowd-counting-model-python/)

[https://nanonets.com/blog/crowd-counting-review/](https://nanonets.com/blog/crowd-counting-review/)

Datasets

[https://gjy3035.github.io/GCC-CL/](https://gjy3035.github.io/GCC-CL/)

Object Detection

[https://paperswithcode.com/paper/efficientdet-scalable-and-efficient-object](https://paperswithcode.com/paper/efficientdet-scalable-and-efficient-object)

[https://paperswithcode.com/paper/a-simple-baseline-for-multi-object-tracking](https://paperswithcode.com/paper/a-simple-baseline-for-multi-object-tracking)

[https://paperswithcode.com/paper/tracking-objects-as-points](https://paperswithcode.com/paper/tracking-objects-as-points)

[https://motchallenge.net](https://motchallenge.net)

[https://towardsdatascience.com/kalman-filter-an-algorithm-for-making-sense-from-the-insights-of-various-sensors-fused-together-ddf67597f35e](https://towardsdatascience.com/kalman-filter-an-algorithm-for-making-sense-from-the-insights-of-various-sensors-fused-together-ddf67597f35e)

More information, and code base can be found at [github/kartavya](https://github.com/nidran/kartavya)
