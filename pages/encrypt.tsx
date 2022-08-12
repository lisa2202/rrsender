import { CopyIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  IconButton,
  Spinner,
  Text,
  Textarea,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Head from "next/head";
import { useRouter } from "next/router";

interface EncryptProps {}

const schema = yup.object().shape({
  unencrypted: yup.string().required(`Please provide a text to encrypt`),
});

export const Encrypt: React.FC<EncryptProps> = ({}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [encrypted, setEncrypted] = useState(``);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: `onSubmit`,
  });

  const toast = useToast();

  const onCopy = async () => {
    const text = document.getElementById(`encrypted`)?.innerHTML || ``;
    if ("clipboard" in navigator) {
      await navigator.clipboard.writeText(text);
    } else {
      document.execCommand("copy", true, text);
    }

    setIsOpen(true);

    setTimeout(() => {
      setIsOpen(false);
    }, 5000);
  };

  const onEncrypt = handleSubmit(async (data) => {
    setLoading(true);
    const formData = new FormData();
    formData.append(`unencrypted`, data.unencrypted);

    try {
      const response = await fetch(`api/encrypt`, {
        method: `POST`,
        body: formData,
      });

      const encrypted = (await response.json()).encrypted;
      setEncrypted(encrypted);
    } catch (error) {
      toast({
        title: "Something went wrong",
        description:
          "We could not encrypt your text please try again later or contact admin.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }

    setLoading(false);
  });

  return (
    <Flex
      w={`100%`}
      h={`100vh`}
      alignItems={`center`}
      justifyContent={`center`}
      bg={`white`}
      p={`20px`}
      fontFamily={`monospace`}
    >
      <Head>
        <title>RocketEncrypt</title>
      </Head>
      <Box maxW={[`100%`, `50%`]} w={`100%`}>
        <Text
          as={`h1`}
          fontWeight={`bold`}
          fontSize={`36px`}
          my={`18px`}
          w={`100%`}
          lineHeight={0.9}
          fontFamily={`didot`}
        >
          RocketEncrypt
        </Text>
        <Textarea
          placeholder={`Your text...`}
          w={`100%`}
          minH={`150px`}
          borderRadius={0}
          resize={`none`}
          errorBorderColor="crimson"
          isInvalid={errors.unencrypted && errors.unencrypted.message}
          {...register(`unencrypted`)}
        />
        {errors.unencrypted && errors.unencrypted.message ? (
          <Text mt={`10px`} color={`crimson`} fontSize={`12px`}>
            {errors.unencrypted.message}
          </Text>
        ) : null}
        {!loading ? (
          <Flex flexDir={`column`} alignItems={`flex-start`}>
            <Button
              leftIcon={<Text as={`span`}>🔐</Text>}
              colorScheme="black"
              variant="solid"
              bgColor={`black`}
              color={`white`}
              borderRadius={0}
              minW={`200px`}
              my={`18px`}
              disabled={loading}
              onClick={onEncrypt}
            >
              Encrypt
            </Button>
            <Button
              leftIcon={<Text as={`span`}>📬</Text>}
              variant={`link`}
              mb={`18px`}
              _focus={{}}
              onClick={() => router.push(`/`)}
            >
              go to Sender
            </Button>
          </Flex>
        ) : (
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="black"
            size="md"
            my={`18px`}
          />
        )}
        {encrypted ? (
          <Box
            bg={`black`}
            color={`green.400`}
            p={`18px`}
            minH={`150px`}
            pos={`relative`}
          >
            <Text fontFamily={`monospace`} id={`encrypted`}>
              {encrypted}
            </Text>
            <Tooltip hasArrow label="Copied" isOpen={isOpen}>
              <IconButton
                variant="unstyled"
                colorScheme="teal"
                aria-label="Call Sage"
                fontSize="20px"
                pos={`absolute`}
                bottom={`18px`}
                right={`18px`}
                _focus={{}}
                onClick={onCopy}
                icon={<CopyIcon />}
              />
            </Tooltip>
          </Box>
        ) : null}
      </Box>
    </Flex>
  );
};

export default Encrypt;
