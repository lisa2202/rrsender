import {
  Box,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  Textarea,
  Button,
  Text,
  Link,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import ScrollableFeed from "react-scrollable-feed";
import type { NextPage } from "next";
import Head from "next/head";
import SocketIOClient, { Socket } from "socket.io-client";
import { useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter } from "next/router";
import { FileUpload } from "../components/FileUpload";
import { numbersToArray } from "../utility/numbersToArray";
import { FileContext } from "../context/fileContext";

const schema = yup.object().shape({
  file: yup.mixed(),
  apiKey: yup.string().required(`Please provide a telnyx api key`),
  msgProfileId: yup
    .string()
    .required(`Please provide a telnyx messaging profile id`),
  numbers: yup
    .string()
    .test(
      `numbersLnegth`,
      `Too many numbers, upload a file instead`,
      (numbers) => {
        const numsArr = numbers ? numbersToArray(numbers) : [];

        return numsArr.length < 1000;
      }
    ),
  message: yup.string().required(`Please provide a message to send`),
});

type NumStatus = {
  number: string;
  status: `sent` | `delivered` | `failed` | `delivery_failed`;
};

const Home: NextPage = () => {
  const router = useRouter();
  const toast = useToast();
  const [tabIndex, setTabIndex] = useState(0);
  const { file: uploadedFile } = useContext(FileContext) as FileType;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: `onSubmit`,
  });

  const [messages, setMessages] = useState<NumStatus[]>([]);

  const [loading, setLoading] = useState<null | boolean>(null);

  let socket: Socket;

  const socketInitializer = async () => {
    await fetch(`/api/socketio`);

    socket = SocketIOClient();

    socket.on("connect", () => {
      console.log("SOCKET CONNECTED!", socket.id);
    });

    socket.on("status", (data) => {
      setMessages((prevState) => [...prevState, data]);
    });

    socket.on("loading", ({ status }) => {
      setLoading(status);
    });

    socket.on("allSent", (data) => {
      if (data) {
        toast({
          description:
            "All sent 🥳, please check the status board for statuses",
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      }
    });
  };

  useEffect((): any => {
    socketInitializer();

    // socket disconnet onUnmount if exists
    if (socket) return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (!data.numbers && !data.file) {
        toast({
          description: "Either provide a file of numbers or enter the numbers",
          status: "error",
          duration: 9000,
          isClosable: true,
        });
        return;
      }

      const formData = new FormData();
      formData.append(`data`, JSON.stringify(data));
      formData.append(`file`, uploadedFile);

      await fetch("/api/message", {
        method: "POST",
        body: formData,
      });

      // reset();
    } catch (error) {
      console.log(error);
    }
  });

  const onStopSending = async () => {
    await fetch(`/api/stopSending`, {
      method: `POST`,
      body: JSON.stringify({
        stopSending: true,
      }),
    });
  };

  return (
    <Box>
      <Head>
        <title>RocketSender</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Flex p={`50px`} pos={`relative`} flexDir={`column`} minH={`100vh`}>
        <Heading
          color={`black`}
          fontSize={`32px`}
          margin={0}
          textAlign={`center`}
          lineHeight={0.9}
          fontFamily={`didot`}
          pos={`absolute`}
          style={{
            writingMode: `vertical-lr`,
          }}
        >
          RocketSender
        </Heading>
        <Stack spacing={4} px={`20px`} w={`100%`} ml={`20px`}>
          <Flex>
            <Box w={`100%`}>
              <InputGroup w={`100%`} flexDir={`column`}>
                <InputLeftElement
                  pointerEvents="none"
                  // eslint-disable-next-line react/no-children-prop
                  children={`🔐`}
                />
                <Input
                  py={`10px`}
                  w={`100%`}
                  placeholder="Telnyx API Key"
                  borderRadius={0}
                  errorBorderColor="crimson"
                  isInvalid={errors.apiKey && errors.apiKey.message}
                  {...register(`apiKey`)}
                />
                {errors.apiKey && errors.apiKey.message ? (
                  <Text mt={`10px`} color={`crimson`} fontSize={`12px`}>
                    {errors.apiKey.message}
                  </Text>
                ) : null}
              </InputGroup>
              <InputGroup w={`100%`} flexDir={`column`} mt={`16px`}>
                <InputLeftElement
                  pointerEvents="none"
                  // eslint-disable-next-line react/no-children-prop
                  children={`💡`}
                />
                <Input
                  py={`10px`}
                  w={`100%`}
                  placeholder="Messaging Profile ID"
                  borderRadius={0}
                  errorBorderColor="crimson"
                  isInvalid={errors.msgProfileId && errors.msgProfileId.message}
                  {...register(`msgProfileId`)}
                />
                {errors.msgProfileId && errors.msgProfileId.message ? (
                  <Text mt={`10px`} color={`crimson`} fontSize={`12px`}>
                    {errors.msgProfileId.message}
                  </Text>
                ) : null}
              </InputGroup>
              <Tabs
                index={tabIndex}
                onChange={(index) => {
                  setTabIndex(index);
                }}
              >
                <TabList>
                  <Tab _focus={{}}>📞 Numbers</Tab>
                  <Tab _focus={{}}>📁 File</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel px={0}>
                    <InputGroup mt={`16px`} flexDir={`column`}>
                      <InputLeftElement
                        pointerEvents="none"
                        // eslint-disable-next-line react/no-children-prop
                        children={`📞`}
                      />
                      {tabIndex === 0 ? (
                        <>
                          <Textarea
                            h={`100px`}
                            w={`100%`}
                            placeholder="Phone numbers..."
                            borderRadius={0}
                            pl={`30px`}
                            resize={`none`}
                            errorBorderColor="crimson"
                            isInvalid={errors.numbers && errors.numbers.message}
                            {...register(`numbers`)}
                          />
                          {errors.numbers && errors.numbers.message ? (
                            <Text
                              mt={`10px`}
                              color={`crimson`}
                              fontSize={`12px`}
                            >
                              {errors.numbers.message}
                            </Text>
                          ) : null}
                        </>
                      ) : null}
                    </InputGroup>
                  </TabPanel>
                  <TabPanel px={0}>
                    {tabIndex === 1 ? (
                      <FileUpload
                        accept={".txt"}
                        // multiple
                        register={register("file")}
                        error={errors.file && errors.file.message}
                      />
                    ) : null}
                    {errors.file && errors.file.message ? (
                      <Text mt={`10px`} color={`crimson`} fontSize={`12px`}>
                        {errors.file.message}
                      </Text>
                    ) : null}
                  </TabPanel>
                </TabPanels>
              </Tabs>
              <InputGroup flexDir={`column`}>
                <InputLeftElement
                  pointerEvents="none"
                  // eslint-disable-next-line react/no-children-prop
                  children={`✍️`}
                />
                <Textarea
                  h={`150px`}
                  w={`100%`}
                  placeholder="Message..."
                  borderRadius={0}
                  pl={`30px`}
                  resize={`none`}
                  errorBorderColor="crimson"
                  isInvalid={errors.message && errors.message.message}
                  {...register(`message`)}
                />
                {errors.message && errors.message.message ? (
                  <Text mt={`10px`} color={`crimson`} fontSize={`12px`}>
                    {errors.message.message}
                  </Text>
                ) : null}
              </InputGroup>
              <Flex my={`32px !important`} alignItems={`center`}>
                {!loading ? (
                  <Flex flexDir={`column`} alignItems={`flex-start`}>
                    <Button
                      leftIcon={<Text as={`span`}>📬</Text>}
                      colorScheme="black"
                      variant="solid"
                      bgColor={`black`}
                      color={`white`}
                      borderRadius={0}
                      minW={`200px`}
                      onClick={onSubmit}
                      disabled={!!loading}
                    >
                      Send
                    </Button>
                    <Button
                      leftIcon={<Text as={`span`}>🔐</Text>}
                      variant={`link`}
                      mt={`18px`}
                      _focus={{}}
                      onClick={() => router.push(`/encrypt`)}
                    >
                      go to Encrypt
                    </Button>
                  </Flex>
                ) : (
                  <>
                    <Spinner
                      thickness="4px"
                      speed="0.65s"
                      emptyColor="gray.200"
                      color="black"
                      size="md"
                      mx={`10px`}
                    />
                    <Button
                      colorScheme="red"
                      variant="link"
                      onClick={onStopSending}
                    >
                      🛑 Stop sending
                    </Button>
                  </>
                )}
              </Flex>
            </Box>
            <Box w={`100%`} px={`36px`}>
              {messages.length ? (
                <Box
                  h={`100%`}
                  maxH={`497px`}
                  bgColor={`blackAlpha.800`}
                  w={`100%`}
                  overflow={`none`}
                  overflowY={`scroll`}
                  pos={`relative`}
                  p={`10px`}
                  pl={`20px`}
                  pr={0}
                >
                  <Flex pos={`absolute`} right={`10px`} bottom={`10px`}>
                    <Text mr={`10px`} fontSize={`12px`} color={`yellow`}>
                      SENT:{" "}
                      {
                        messages.filter((message) => message.status === `sent`)
                          .length
                      }
                    </Text>
                    <Text mr={`10px`} fontSize={`12px`} color={`lightgreen`}>
                      DELIVERED:{" "}
                      {
                        messages.filter(
                          (message) => message.status === `delivered`
                        ).length
                      }
                    </Text>
                    <Text fontSize={`12px`} color={`crimson`}>
                      FAILED:{" "}
                      {
                        messages.filter(
                          (message) =>
                            message.status === `failed` ||
                            message.status === `delivery_failed`
                        ).length
                      }
                    </Text>
                  </Flex>
                  <ScrollableFeed>
                    {messages.map((message, index) => (
                      <Text
                        key={`${message.status}${index}`}
                        as={`span`}
                        color={
                          message.status === `sent`
                            ? `yellow`
                            : message.status === `delivered`
                            ? `lightgreen`
                            : message.status === `failed` ||
                              message.status === `delivery_failed`
                            ? `crimson`
                            : `white`
                        }
                      >
                        <Text
                          as={`span`}
                          fontSize={`11px`}
                          display={`block`}
                          w={`100%`}
                        >
                          {message.number} - {message.status.toUpperCase()}
                        </Text>
                      </Text>
                    ))}
                  </ScrollableFeed>
                </Box>
              ) : null}
            </Box>
          </Flex>
        </Stack>
        <Box
          pos={`absolute`}
          bottom={`20px`}
          fontSize={`12px`}
          color={`gray.500`}
        >
          Built with ❤️ by{" "}
          <Link href={`https://t.me/rocketsmsgateway`}>Rocket</Link> 🚀
        </Box>
      </Flex>
    </Box>
  );
};

export default Home;
