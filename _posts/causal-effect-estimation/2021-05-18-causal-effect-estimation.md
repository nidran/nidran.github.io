---
title: Causal Effect Estimation using LODE
date: 2021-05-18 09:45:47 +07:00
modified: 2021-05-18 09:45:47 +07:00
tags: [ml, mlforhealthcare, causal-inference, sepsis]
description: Causal Inference
image: bach.png
---

Sepsis is a life threatening condition that is a major cause of death amongst ICU patients. To be able to increase the chances of a patient's survival will be immensely beneficial, given the criticality and urgency of the condition. As we saw, when trying to estimate the effects of treatments on Septic patients, we would be doing causal effect estimation with functional confounders, as Sepsis is a functional confounder. Positivity - an essential condition to perform causal effect estimation, is violated in the case of functional confounders. To deal with this violation of positivity (in the case of functional confounders), we use <a href ="https://arxiv.org/abs/2102.08533"> LODE </a>. With the help of the LODE algorithm, we were able to construct surrogate treatments and establish sufficient conditions like C-Redundancy and Surrogate-Positivity
<hr>

#### Dataset

We used the MIMIC - IV dataset for our experiments. MIMIC-IV is sourced from two in-hospital database systems: a custom hospital wide EHR and an ICU specific clinical information system. More details on how to acquire the dataset can be found <a href ="https://physionet.org/content/mimiciv/0.4/"> here </a>



