---
layout: post
title:  Multi Modal Multi Environment Performance Comparison on GCP
date:   2022-05-13 09:45:20 +0700
categories: jekyll update
tags: ['google-cloud', 'cnn', 'rnn', 'docker', 'singularity', 'virtual-machine', 'sentiment-analysis']
image: 
---

### Problem Statement 
In recent years, due to the enormous amount of data, and the advancements in Big Data and Machine Learning Applications, Cloud Comput- ing has become ubiquitous. Most of the applications in today’s world are deployed to the cloud so that they can easily be scaled and accessed by the end-users. Along with deploying the applications in the bare Virtual Machines, the advent of containerized Soft- ware has given the developers a hard time to choose the environment where they should deploy their applications. There are different kinds of applications and Machine Learning workloads and it becomes very important to choose the best environment where the application should be deployed for maximum resource utilization.
In this paper we have tried to compare three environments i.e., the bare Virtual Machine, Docker running inside the Virtual Machine, and Singularity running inside the Virtual Machine on two different workloads i.e., an MNIST digit classifier using Con- volutional Neural Network and a Sentiment Analyzer using Recurrent Neural Network. We have used the same underlying hardware and have run all these workloads using a GPU-enabled Virtual Machine inside the Google Cloud Platform to better compare the metrics and understand the implication of the change of metrics in different environments on the performance of the application.<a href ="https://github.com/nidran/CV-project">here </a>


### Challenges 
* We could not use the free credits to get the GPUs in Google Cloud Platform. An upgraded account was necessary. We also needed to send a request citing the rea- sons needed for the GPU to the Google Cloud Platform team.
* We encountered some CUDA Toolkit version and GPU driver installation is- sues both in the case of the bare Virtual Machine and Docker.
* We also encountered issues installing Singularity inside the Virtual Machine.
* We encountered permission issues with the GPU Profiling, especially in the case of Singularity.
* Ncu support is removed from cheaper GPU options like NVIDIA Tesla P4, so we had to resort to the costlier options.


### Learnings
* The FLOPs for the same model can differ in different environments. We have seen this in the case of MNIST Digit Classi- fication using Convolutional Neural Net- work.
* FLOPs cannot be used as a universal proxy for efficiency, it depends on which type of Memory and Accumulate opera- tions are being done [8]. As we have seen in the case of FLOPS and HBM Transac- tions, even though the FLOPS were way lesser in the case of bare Virtual Machine for CNN, the time taken by the model for the same number of epochs was the same for all the environments.
* Singularity has native support for the GPU and hence its performance was slightly better when compared with Docker.
* Both the workloads performed similarly in the 3 environments, but we believe for the containerization purposes, singularity wins. This is because it is relatively more secure, has native GPU support, and can be used with Kubernetes as well.

### Conclusion 
We have analyzed and compared two different workloads CNN and RNN in three different environments. We have observed some interesting results in the case of FLOPS and the High Bandwidth Transaction calculation. This
research can be helpful in gaining a deep in- sight into the GPU metrics in different environ- ments. Apart from the time, we also compared the memory overhead, throughput, FLOPS, and transactions to gain a deeper understanding of the results we got.
In the future, we want to explore more about why and how a particular model chooses a kernel. We want to profile the State of the art models instead of profiling the baseline models. We also want to profile more containers like Charlie cloud and compare its performance with other containers like Docker. There are some researches that show the performance of Charlie Cloud is better than Docker. We want to compare Charlie Cloud with Singularity for the State of the art models. We also want to experiment with unikernels and profile other models like LSTM and Transformers to see if our results hold with other models as well.



<!-- Detailed Report can be found <a href ="https://github.com/nidran/CV-project/blob/main/CV.pdf"> here</a> -->