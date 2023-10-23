import Image from "next/image";
import React from 'react';
import { Museum } from '@prisma/client'
import Link from 'next/link';
import getMuseums from './Museums';


export const MuseumSection = async ({ query }: { query: string }) => {
    const museumsArr: Museum[] = await getMuseums();
    const museums = museumsArr.slice(0, 3);
    return (
        <div className='bg-gray-200 mb-5 h-5/6 shadow-inner rounded-sm'>
            <p className='pt-5 pl-2 text-3xl font-semibold'>New York</p>
            <div className='divider divider-vertical my-[8px] pl-2 pr-2 before:bg-gray-500 after:bg-gray-500'></div>
            <div className="flex w-full h-5/6 p-2">
                {museums.map((museum, index) => (
                    <div key={index} className="flex w-full p-2">
                        <div className="card rounded-md w-full bg-base-100 shadow-lg flex flex-col justify-between">
                            <figure className='h-1/2'>
                                <Image
                                    src={museum.main_image || ''}
                                    alt={museum.name}
                                    width={300}
                                    height={100}
                                    className="object-cover"
                                />
                            </figure>
                            <div className="card-body flex flex-col justify-between">
                                <div>
                                    {/* Set a fixed height for the card title */}
                                    <h2 className="card-title line-clamp h-[3rem] mb-[1rem]">{museum.name}</h2>
                                    {/* Set a fixed height for the address */}
                                    <Link href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(museum?.address || '') + '+' + encodeURIComponent(museum?.city || '') + '+' + encodeURIComponent(museum?.state || '')}
                                        rel="noopener noreferrer" target="_blank"
                                        className='mb-[.5rem] h-[2rem] block'>
                                        {museum?.city}, {museum?.state}
                                    </Link>
                                </div>
                                <div className="card-actions justify-evenly">
                                    <Link href={"/museums/" + museum.id} className="w-full">
                                        <button className="btn btn-primary w-full bg-[#661900]">View Museum</button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};