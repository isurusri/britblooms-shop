import { Metadata } from "next"
import { notFound } from "next/navigation"

import { sdk } from "@lib/config"
import { getRegion, listRegions } from "@lib/data/regions"
import {
  getProductByHandle,
  getProductFashionDataByHandle,
} from "@lib/data/products"
import ProductTemplate from "@modules/products/templates"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then(
      (regions) =>
        regions
          ?.map((r) => r.countries?.map((c) => c.iso_2))
          .flat()
          .filter(Boolean) as string[]
    )

    if (!countryCodes) {
      return []
    }

    const { products } = await sdk.store.product.list(
      { fields: "handle" },
      { next: { tags: ["products"] } }
    )

    const staticParams = countryCodes
      ?.map((countryCode) =>
        products.map((product) => ({
          countryCode,
          handle: product.handle,
        }))
      )
      .flat()
      .filter((product) => product.handle)

    return staticParams
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, countryCode } = await params
  const region = await getRegion(countryCode)

  if (!region) {
    return {
      title: "Product Not Found | Medusa Store",
      description: "Product not found",
    }
  }

  try {
    const product = await getProductByHandle(handle, region.id)

    if (!product) {
      return {
        title: "Product Not Found | Medusa Store",
        description: "Product not found",
      }
    }

    return {
      title: `${product.title} | Medusa Store`,
      description: `${product.title}`,
      openGraph: {
        title: `${product.title} | Medusa Store`,
        description: `${product.title}`,
        images: product.thumbnail ? [product.thumbnail] : [],
      },
    }
  } catch (error) {
    // Return default metadata if there's an error
    console.error(
      `Error generating metadata for product ${handle}:`,
      error instanceof Error ? error.message : error
    )
    return {
      title: "Product | Medusa Store",
      description: "Product",
    }
  }
}

export default async function ProductPage({ params }: Props) {
  const { handle, countryCode } = await params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  try {
    const [pricedProduct, fashionData] = await Promise.all([
      getProductByHandle(handle, region.id),
      getProductFashionDataByHandle(handle),
    ])

    if (!pricedProduct) {
      notFound()
    }

    return (
      <ProductTemplate
        product={pricedProduct}
        materials={fashionData.materials}
        region={region}
        countryCode={countryCode}
      />
    )
  } catch (error) {
    // Log error for debugging but don't crash the build
    console.error(
      `Error loading product ${handle} for region ${region.id}:`,
      error instanceof Error ? error.message : error
    )
    notFound()
  }
}
