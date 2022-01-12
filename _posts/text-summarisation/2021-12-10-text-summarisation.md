---
layout: post
title:  Abstractive and Extractive Text Summarisation
date:   2021-12-10 09:29:20 +0700
categories: jekyll update
---
### Problem Statement
The volume of scientific literature published eachyear is overwhelming for students and researchers,and one needs to get through all this informationquickly.  At the same time, it is vital to not missout on any critical information. The solution to thisdilemma of trading time for information coverageis the advent of Text Summarization.Implementing automatic summarization can en-hance the readability of documents and reduce thetime spent researching for information. While ab-stractive methods have a higher chance of capturingmore information working within a word-limit, inthe case of research papers, it is important to some-times capture certain information verbatim. Thereare well-established SOTA models for both kindsof text summarization that we will apply to datasetsof scientific papers and conduct a comparative anal-ysis of the results from those experiment.

### Dataset
We downloaded the datasetof scientific research papers from Science Direct which contains a lot of publications.  We had togenerate an API key using the NYU institutionalemail address on Elsevier and connect to the NYUVPN to make requests to the API to download thefull content of the scientific paper. We downloadedaround∼10Kscientific  papers  for  our  experi-ments which were in XML format and convertedto a text format which is mentioned in the nextsection

### Extraction Based Summarisation 
Extraction Based Summarisation approaches generate a summary by selecting important existing words, phrases, or sentences from the original text. The words or phrases are rearranged slightly to give the sentence a structure. This method is analogous to using a highlighter to highlight important sentences in a paper, as most of us often do in a manual setting. This method maintains the information from the original paper verbatim, introducing no unseen words or phrases. The extraction-based summarization algorithm firstly generates an importance score for each sentence. The TextRank algorithm is a graph-based unsupervised text summarization algorithm, where sentences are modeled as vertices and the ranking of vertices follows the same algorithm as the PageRank algorithm. The highest-ranked vertices are then selected to form the summary.
Alongside this, we use BERT sentence embeddings to build an extractive summarizer taking supervised approaches which would incorporate sequential information. BERT (Bidirectional transformer) is a pre-trained bidirectional transformer model that jointly conditions on both left and right contexts, with attention mechanism. It is used to overcome the limitations of RNN and other neural networks as Long term dependencies are well handled without increasing the computation cost. 

### Abstractive Based Summarisation
Abstraction-based summarization approach, which generates a summary by taking out the important word, phrase, or sentence from an original text document and rephrasing it with proper synonyms. This method is analogous to reading the paper and writing in your own words a summary combining the most important points. It tends to be more complicated than the extraction-based technique due to the involvement of figuring out the correct synonyms and correctly rephrasing the sentence. In this category, we train and analyse the xlnet model and pointer generator models

### Results

| Model   | Rouge - 1  | Rouge - 2 | Rouge - L | BLEU |
| --------| --------------------|------------------|
| TextRank   | 0.447                | 0.245             | 0.257 | 0.206 |
| BERT  |   0.510     | 0.277          | 0.305 | 0.268 | 
| XLNet| 0.443  | 0.236   | 0.241 | 0.168 |
| PGN | 0.502   | 0.284 | 0.313 | 0.252 |


### Conclusion
Although the results from our experiment are as expected, we can improve them with some other approaches in future. We can work on the data preprocessing of the scientific papers to better handle the equations or tables present in the paper. Further, we can consider to use paragraph embedding for better representation of the document which can then be fed into the models for better results. Moreover, we can try to gather a large dataset of scientific research papers and train the models for a longer period of time to improve the results. Lastly, we should devise a new metric that compares the semantics between the gold and generated summary as compared to overlap of words that occur in both gold and generated summary.