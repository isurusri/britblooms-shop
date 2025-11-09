import { Metadata } from "next"
import Image from "next/image"
import { StoreRegion } from "@medusajs/types"
import { listRegions } from "@lib/data/regions"
import { Layout, LayoutColumn } from "@/components/Layout"

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about Britblooms",
}

export async function generateStaticParams() {
  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions.flatMap((r) =>
      r.countries
        ? r.countries
            .map((c) => c.iso_2)
            .filter(
              (value): value is string =>
                typeof value === "string" && Boolean(value)
            )
        : []
    )
  )

  const staticParams = countryCodes.map((countryCode) => ({
    countryCode,
  }))

  return staticParams
}

export default function AboutPage() {
  return (
    <>
      <div className="max-md:pt-18">
        <Image
          src="/images/content/bg-6.png"
          width={2880}
          height={1500}
          alt="Background 5"
          className="md:h-screen md:object-cover"
        />
      </div>
      <div className="pt-8 md:pt-26 pb-26 md:pb-36">
        <Layout>
          <LayoutColumn start={1} end={{ base: 13, lg: 7 }}>
            <h3 className="text-md max-lg:mb-6 md:text-2xl">
              At Britblooms, we blend the Beauty of Nature into Everyday Living.
            </h3>
          </LayoutColumn>
          <LayoutColumn start={{ base: 1, lg: 8 }} end={13}>
            <div className="md:text-md lg:mt-18">
              <p className="mb-5 lg:mb-9">
                Welcome to Britblooms, where our passion is rooted in Nature,
                Design, and Harmony. We embrace the art of living nature
                bringing you closer to the beauty of the natural world, whether
                in your indoor or outdoor spaces.
              </p>
              <p>
                Every piece in our collection is designed with care, blending
                timeless craftsmanship with modern aesthetics to offer you the
                perfect balance between beauty and the natural world.
              </p>
            </div>
          </LayoutColumn>
          <LayoutColumn>
            <Image
              src="/images/content/bg-5.png"
              width={2496}
              height={1404}
              alt="Background 5"
              className="mt-26 lg:mt-36 mb-8 lg:mb-26"
            />
          </LayoutColumn>
          <LayoutColumn start={1} end={{ base: 13, lg: 8 }}>
            <h3 className="text-md lg:mb-10 mb-6 md:text-2xl">
              We are here to make your living space a true reflection of your
              personal style.
            </h3>
          </LayoutColumn>
          <LayoutColumn start={1} end={{ base: 13, lg: 6 }}>
            <div className="mb-16 lg:mb-26">
              <p className="mb-5 md:mb-9">
                Every piece in our collection is designed with care, blending
                timeless craftsmanship with modern aesthetics to offer you the
                perfect balance between beauty and the natural world.
              </p>
            </div>
          </LayoutColumn>
          <LayoutColumn start={{ base: 2, lg: 1 }} end={{ base: 12, lg: 7 }}>
            <Image
              src="/images/content/bg-2.png"
              width={1200}
              height={1600}
              alt="Background 2"
              className="mb-16 lg:mb-46"
            />
          </LayoutColumn>
          <LayoutColumn start={{ base: 1, lg: 8 }} end={13}>
            <div className="mb-6 lg:mb-20 xl:mb-36">
              <p>
                We believe that great design should be environmentally
                conscious, which is why we strive to minimise our environmental
                footprint through responsible sourcing and production practices.
                Our commitment to sustainability ensures that our products are
                not only beautiful but also kind to the planet.
              </p>
            </div>
            <div className="md:text-md max-lg:mb-26">
              <p>
                We believe that great design should be environmentally
                conscious, which is why we strive to minimise our environmental
                footprint through responsible sourcing and production practices.
                Our commitment to sustainability ensures that our products are
                not only beautiful but also kind to the planet.
              </p>
            </div>
          </LayoutColumn>
        </Layout>
        <Image
          src="/images/content/bg-7.jpg"
          width={2880}
          height={1618}
          alt="Background 7"
          className="mb-8 lg:mb-26"
        />
        <Layout>
          <LayoutColumn start={1} end={{ base: 13, lg: 7 }}>
            <h3 className="text-md max-lg:mb-6 md:text-2xl">
              Our customers are at the center of everything we do !
            </h3>
          </LayoutColumn>
          <LayoutColumn start={{ base: 1, lg: 8 }} end={13}>
            <div className="md:text-md lg:mt-18">
              <p className="mb-5 lg:mb-9">
                Our team is here to help guide you through the process, offering
                personalised support to ensure that you find exactly what you
                are looking for.
              </p>
              <p>
                We are not just selling products - we are helping you create
                spaces where you can relax, recharge, and make lasting
                memories.Thank you for choosing Britblooms to be a part of your
                home!
              </p>
            </div>
          </LayoutColumn>
        </Layout>
      </div>
    </>
  )
}
