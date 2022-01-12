---
title: Breast Cancer Classification 
date: 2018-05-28 09:45:47 +07:00
modified: 2018-05-28 09:45:47 +07:00
tags: [ml, mlforhealthcare, imageclassification]
description: Breast Cancer classification
image: /breast-cancer/bach.png
---

Breast cancer is one of the leading cancer-related death causes worldwide, specially on women. However, early diagnosis significantly increases treatment success. For the purpose of early diagnosis, proper analysis of histology images is essential. Specifically, during the diagnosis procedure, specialists evaluate both overall and local tissue organization via whole-slide and microscopy images. However, the large amount of data and complexity of the images makes this task time consuming and non-trivial. Because of this, the development of automatic detection and diagnosis tools is challenging but also essential for the field.

<hr>

#### Dataset

The dataset is composed of Hematoxylin and eosin (H&E) stained breast histology microscopy and whole-slide images. Challenge participants were expected to evaluate the performance of their method on either/both sets of images.

#### Approach
 A CNN-based hierarchical classifier to classify histopathology images  into  4  classes  namely,  Normal,  Benign,  InSitu  and  Invasive  is  proposed.
 In the first level of the hierarchical classifier, a two class CNN-based classifieris built to discriminate images of Normal class from the images of the rest ofthe classes. In the second stage of hierarchy we built a majority voting basedclassifier where the votes are given by the 3 binary CNN-based classifiers. The binary  CNN-based  classifiers  are  built  in  one-vs-one  way  to  discriminate  oneclass from another. The studies were performed on the dataset provided in theBACH challenge. The proposed hierarchical classifier is found to perform good in classifying histopathology images into Normal, Invasive, Benign and InSituclasses. In future, the proposed approach may be extended to classification of other histopathology image

<figure>
<img src="{{page.image}}" alt="">
<figcaption>Fig 1. Confusion Matrix </figcaption>
</figure>


More details and code can be found <a href = "https://github.com/nidran/bach">here </a>
Direct Link to the paper can be found <a href ="https://github.com/nidran/bach/blob/master/bach_paper2_NIPS%20(3).pdf "> here </a>The link for the challenge can be found <a href ="https://iciar2018-challenge.grand-challenge.org"> here</a>



