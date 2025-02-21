"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { isNil } from "lodash";
import { useNft } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Variants, motion } from "framer-motion";
import ParentPanel from "./ParentPanel";
import { ChevronDownCircle, ChevronUpCircle } from "lucide-react";
import { Nft } from "alchemy-sdk";
import { SignatureCanvas } from "@/components/ui";

interface TokenParams {
  params: {
    tokenId: string;
    contractAddress: string;
    chainId: string;
  };
  searchParams: {
    disableloading: string;
    logo?: string;
    childNetwork?: string;
    flip?: boolean;
  };
}

export default function Token({ params, searchParams }: TokenParams) {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const { tokenId, contractAddress, chainId } = params;
  const { disableloading } = searchParams;
  const chainIdNumber = parseInt(chainId);
  const {
    data: nftImages,
    nftMetadata,
    loading: nftMetadataLoading,
    parent,
    isTBA,
    canvasData,
  } = useNft({
    tokenId: parseInt(tokenId as string),
    contractAddress: contractAddress as `0x${string}`,
    chainId: chainIdNumber,
  });

  const { nftMetadata: parentNftMetadata, data: parentNftImages } = useNft({
    tokenId: parent?.parent_token_id ? parseInt(parent?.parent_token_id) : undefined,
    contractAddress: parent?.parent_contract_address as `0x${string}`,
    chainId: parent?.parent_chain_id ? parseInt(parent?.parent_chain_id) : undefined,
  });

  useEffect(() => {
    if (!isNil(nftImages) && nftImages.length) {
      // @ts-ignore
      const imagePromises = nftImages.map((src: string) => {
        return new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = resolve;
          image.onerror = reject;
          image.src = src;
        });
      });

      Promise.all(imagePromises)
        .then(() => {
          setImagesLoaded(true);
        })
        .catch((error) => {
          console.error("Error loading images:", error);
        });
    }
  }, [nftImages, nftMetadataLoading]);

  const [isShowing, toggleShow] = useState<boolean>(false);

  const showLoading = disableloading !== "true" && nftMetadataLoading;

  const variants = {
    closed: { y: "100%", transition: { duration: 0.75 }, height: "0%" },
    open: { y: "0", transition: { duration: 0.35 }, height: "55%" },
  } as Variants;

  if (showLoading) {
    return <Skeleton className="h-full w-full bg-slate-400" />;
  }

  const displayCanvas = canvasData && parent?.parent_base_image;
  return (
    <>
      {isTBA && parentNftMetadata && (
        <div className="max-w-[1080px]">
          <div
            className="absolute left-0 top-0 z-10 m-3 cursor-pointer rounded-full bg-zinc-300 p-1 text-zinc-900 opacity-50 transition-opacity duration-500 ease-in hover:opacity-100"
            onClick={() => toggleShow((t) => !t)}
          >
            {isShowing ? <ChevronDownCircle /> : <ChevronUpCircle />}
          </div>
          <motion.div
            className={`custom-scroll absolute bottom-0 z-10 w-full max-w-[1080px] overflow-y-auto`}
            animate={isShowing ? "open" : "closed"}
            variants={variants}
            initial="closed"
          >
            <ParentPanel
              tokenId={tokenId}
              contractAddress={contractAddress}
              chainIdNumber={chainIdNumber}
            />
          </motion.div>
        </div>
      )}
      <div className={`h-full w-full bg-black`}>
        <div
          className={`group relative grid h-full w-full grid-cols-1 grid-rows-1 transition ${
            imagesLoaded ? "" : "blur-xl"
          }
          `}
        >
          {displayCanvas && (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <SignatureCanvas
                baseImage={parent?.parent_base_image}
                canvasData={JSON.stringify(canvasData)}
              />
            </div>
          )}
          {!displayCanvas && !isNil(nftImages) ? (
            nftImages.map((image, i) => (
              <img
                key={i}
                className={`col-span-1 col-start-1 row-span-1 row-start-1 h-full w-full translate-x-0 bg-slate-200`}
                src={image}
                alt="Nft image"
              />
            ))
          ) : (
            <></>
          )}
        </div>
      </div>
    </>
  );
}
