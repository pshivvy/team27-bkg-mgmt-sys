'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { ChangeEvent, useEffect, useState } from 'react';
import { Museum } from '@prisma/client';
import { useMuseums } from '../contexts/MuseumContext';
import { Image, Loader, Button, Text, Paper, Container, Accordion, NumberInput, StylesApiProps, Group, Box } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { TextInput, Space, Checkbox } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useSession } from "next-auth/react";
import { useRoleRedirect } from '../components/useRoleRedirect';

var fieldStyles = {
    input: { borderColor: 'black', backgroundColor: 'white' },
}

export default function Page() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const { getMuseumsByField } = useMuseums();
    var museum = getMuseumsByField('id', parseInt(searchParams?.get("id") || "1"))[0];

    useRoleRedirect();

    const ticketPrice = museum?.cost || 0;

    return <main className="h-screen">
        {museum ? (
            <div>
                <Paper
                    style={{
                        backgroundImage: `linear-gradient(rgba(255, 255, 255, .7), rgba(255, 255, 255, .7)), url('${museum?.bg_image}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        padding: '1rem'
                    }}
                >
                    <div className="flex flex-col lg:flex-row items-center justify-center h-full w-full">
                        {museum && (
                            <Image
                                radius="md"
                                height={175}
                                width="auto"
                                fit="cover"
                                alt={museum.name}
                                src={museum.main_image || ""}
                                style={{ border: "3px solid black", maxWidth: '350px', maxHeight: '350px', boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.2)' }}
                            />
                        )}
                        <div className="ml-2">
                            <Text size="2.5rem" style={{ fontWeight: 'bold' }}>{museum?.name}</Text>
                        </div>
                    </div>
                </Paper>

                <CreditCardForm ticketPrice={ticketPrice} />
            </div>

        ) : <div className="flex justify-center items-center h-full">
            <Loader />
        </div>}
    </main>
}


function getTotalCost(numberOfTickets: number, ticketPrice: number, giftShop: boolean, cafe: boolean, promoDiscount: number) {
    const taxRate = .08
    var cost = numberOfTickets * ticketPrice;
    if (giftShop == true) {
        cost = cost + 5;
    }
    if (cafe == true) {
        cost = cost + 5;
    }
    const tax = cost * taxRate;
    if (promoDiscount != 0) {
        var totalCost = (cost * (1 - (promoDiscount / 100))) + tax
    } else {
        var totalCost = (cost + tax)
    }
    return totalCost;
}

function getTotalTax(ticketPrice: number) {
    ticketPrice = ticketPrice * .08;
    return ticketPrice;
}

function displayPriceSection(cost: number, tax: number, promoDiscount: number, numberOfTickets: number, giftShop: boolean, cafe: boolean) {
    if (promoDiscount == undefined) {
        promoDiscount = 0;
    }
    promoDiscount = promoDiscount * 100
    var ticketCost = cost * numberOfTickets
    if (giftShop == true) {
        ticketCost = ticketCost + 5;
    }
    if (cafe == true) {
        ticketCost = ticketCost + 5;
    }

    return <>
        <div className="border-black border-[3px] my-4 p-4 max-w-md shadow-2xl">
            <div className="flex justify-between">
                <span>Cost:</span>
                <span>${ticketCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
                <span>Tax:</span>
                <span>${getTotalTax(ticketCost).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
                <span>Promo:</span>
                <span>-{promoDiscount.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
                <span>Total Cost:</span>
                <span>${getTotalCost(numberOfTickets, cost, giftShop, cafe, promoDiscount).toFixed(2)}</span>
            </div>
        </div>


    </>
}

export function CreditCardForm({ ticketPrice }: { ticketPrice: number }) {
    const searchParams = useSearchParams();
    const { getMuseumsByField } = useMuseums();
    const router = useRouter();
    var museum = getMuseumsByField('id', parseInt(searchParams?.get("id") || "1"))[0];
    const [promo, setPromo] = useState<string | null>(null);


    useEffect(() => {
        const fetchPromo = async () => {
            try {
                const response = await fetch(`/api/promos?promoId=${searchParams?.get("promoId")}`);
                if (response.ok) {
                    const data = await response.json();
                    setPromo(data.id || '');
                }
            } catch (error) {
                console.error("Error fetching promo code:", error);
            }
        };

        fetchPromo();
    }, [searchParams]);

    useEffect(() => {
        form.setFieldValue('promo', promo || '');
    }, [promo]);

    // Initialize form with validation rules
    const { data: session } = useSession();
    const form = useForm({
        initialValues: {
            totalTickets: 0,
            giftShop: false,
            cafe: false,
            name: session ? session.user?.name : '',
            email: session ? session.user?.email : '',
            cardNumber: '',
            expDate: '',
            cvv: '',
            zipCode: '',
            promo: promo || '',
            promoVal: 0,
        },

        validate: {
            cardNumber: (value) => (/^\d{16}$/.test(value) ? null : 'Invalid card number'),
            expDate: (value) => (/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(value) ? null : 'Invalid date'),
            cvv: (value) => (/^\d{3,4}$/.test(value) ? null : 'Invalid CVV'),
            zipCode: (value) => (/^\d{5}$/.test(value) ? null : 'Invalid ZIP code'),
        },
    });

    async function createBooking() {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: session ? session.user?.id : '',
                museumId: museum.id,
                name: form.values.name,
                visitInfo: value,
                totalCost: getTotalCost(form.values.totalTickets, ticketPrice, form.values.giftShop, form.values.cafe, form.values.promoVal),
                employeeBooked: false,
                totalVisitors: form.values.totalTickets,
                creditCardInfoId: "clpiysjow0000ufmsj6jyv1p3"
            }),
        });
        if (response.ok) {
            const data = await response.json();
            router.push(`/confirmation?id=${data.booking.id}`);
        } else {
            const errorData = await response.json();
        }
    }


    const handleCardNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.replace(/\D/g, ''); // Remove non-digits
        form.setFieldValue('cardNumber', value.slice(0, 16))
    };

    const handleExpDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.replace(/\D/g, '');
        let formattedValue = value;
        if (value.length >= 3) {
            // Add a slash after the second digit if the length is at least 3
            formattedValue = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
        }
        form.setFieldValue('expDate', formattedValue)
    };

    const handleCvvChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.replace(/\D/g, ''); // Remove non-digits
        form.setFieldValue('cvv', value.slice(0, 3))
    };

    const handleZipCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.replace(/\D/g, ''); // Remove non-digits
        form.setFieldValue('zipCode', value.slice(0, 5))
    };

    const handlePromo = async () => {
        const promo = await fetch(`/api/promos?promoId=${form.values.promo}`)
        if (promo.ok) {
            const res = await promo.json();
            if (res.museumId === museum.id || res.active === true) {
                form.setFieldValue('promoVal', res.discountPercent);
            }
        }
    };

    const [value, setValue] = useState<Date | null>(null);
    const [date, setDate] = useState(new Date());

    const handleChange = (val: Date | null) => {
        if (val !== null) {
            setDate(val);
        }

        setValue(val);
    };


    return (
        <Box style={{ maxWidth: 300 }}>
            <form onSubmit={form.onSubmit((values) => console.log(values))}>


                <p className="text-3xl font-bold mb-8 text-left"> General Info</p>
                <NumberInput
                    label="Total tickets"
                    placeholder="Choose a number between 1 and 10"
                    defaultValue="1"
                    min={1}
                    max={10}
                    {...form.getInputProps('totalTickets')}
                    style={{ maxWidth: '24rem' }}
                    styles={fieldStyles}
                />
                <DateTimePicker
                    label="Pick date and time"
                    date={date}
                    onDateChange={setDate}
                    value={value}
                    onChange={handleChange}
                />
                <Checkbox className="flex flex-wrap items-center my-4"
                    label="Add Giftshop access"
                    {...form.getInputProps('giftShop')}
                    color='rgba(166, 0, 0, 1)'
                />
                <Checkbox className="flex flex-wrap items-center"
                    label="Add Cafe access"
                    {...form.getInputProps('cafe')}
                    color='rgba(166, 0, 0, 1)'
                />

                <div className="flex flex-wrap items-center my-4">
                    <Text style={{ fontWeight: 700 }}>Name: </Text>
                    <Space style={{ width: '20px' }} />
                    <TextInput
                        {...form.getInputProps('name')}
                        style={{ maxWidth: '24rem' }}
                        styles={fieldStyles}
                    />
                </div>

                <div className="flex flex-wrap items-center my-4">
                    <Text style={{ fontWeight: 700 }}>Email: </Text>
                    <Space style={{ width: '20px' }} />
                    <TextInput
                        {...form.getInputProps('email')}
                        style={{ maxWidth: '24rem' }}
                        styles={fieldStyles}
                    />
                </div>

                <p className="text-3xl font-bold mb-8 text-left">Add payment information</p>

                <TextInput
                    required
                    label="Card Number"
                    placeholder="1234 1234 1234 1234"
                    {...form.getInputProps('cardNumber')}
                    error={form.errors.cardNumber}
                    onChange={handleCardNumberChange}
                    styles={fieldStyles}
                />

                <TextInput
                    required
                    label="Expiration Date"
                    placeholder="MM/YY"
                    {...form.getInputProps('expDate')}
                    error={form.errors.expDate}
                    onChange={handleExpDateChange}
                    styles={fieldStyles}
                />

                <TextInput
                    required
                    label="CVV"
                    placeholder="123"
                    {...form.getInputProps('cvv')}
                    error={form.errors.cvv}
                    onChange={handleCvvChange}
                    styles={fieldStyles}
                />

                <TextInput
                    required
                    label="ZIP Code"
                    placeholder="12345"
                    {...form.getInputProps('zipCode')}
                    error={form.errors.zipCode}
                    onChange={handleZipCodeChange}
                    styles={fieldStyles}
                />

                <Group style={{ marginTop: 'md' }}>
                    <TextInput
                        label="Add a promo code"
                        {...form.getInputProps('promo')}
                        styles={fieldStyles}
                    />
                    <Button
                        color='rgba(166, 0, 0, 1)'
                        style={{ margin: '1.25rem 0' }}
                        onClick={(e) => handlePromo()}
                    >Apply Promo
                    </Button>
                </Group>

                {displayPriceSection(ticketPrice, .08, form.values.promoVal, form.values.totalTickets, form.values.giftShop, form.values.cafe)}
                <Button component="a" color='rgba(166, 0, 0, 1)' onClick={createBooking} style={{ margin: '1.25rem 0' }}>Complete Ticket Payment</Button>

            </form>

        </Box>
    );
}
