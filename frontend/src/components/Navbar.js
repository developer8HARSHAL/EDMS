import React from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  IconButton,
  Avatar,
  Collapse,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  HamburgerIcon, 
  CloseIcon, 
  ChevronDownIcon, 
  ChevronRightIcon 
} from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {

  
  const { isOpen, onToggle } = useDisclosure();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box position="sticky" top={0} zIndex={100}>
      <Flex
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.900')}
        align={'center'}
        boxShadow="sm"
      >
        <Flex
          flex={{ base: 1, md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}
        >
          <IconButton
            onClick={onToggle}
            icon={isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />}
            variant={'ghost'}
            aria-label={'Toggle Navigation'}
          />
        </Flex>
        <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
          <Link
            as={RouterLink}
            to="/"
            textAlign={useDisclosure.isOpen ? 'left' : 'center'}
            fontFamily={'heading'}
            color={useColorModeValue('gray.800', 'white')}
            fontWeight="bold"
            fontSize="xl"
            _hover={{
              textDecoration: 'none',
            }}
          >
            DocManager
          </Link>

          <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
            <DesktopNav isAuthenticated={isAuthenticated} currentPath={location.pathname} />
          </Flex>
        </Flex>

        <Stack
          flex={{ base: 1, md: 1 }}
          justify={'flex-end'}
          direction={'row'}
          spacing={6}
        >
          {isAuthenticated ? (
            <Menu>
              <MenuButton
                as={Button}
                rounded={'full'}
                variant={'link'}
                cursor={'pointer'}
                minW={0}
              >
                <Flex align="center">
                  <Avatar 
                    size="sm" 
                    name={user?.name || 'User'} 
                    mr={2}
                    bg="blue.500"
                  />
                  <Text display={{ base: 'none', md: 'block' }}>
                    {user?.name}
                  </Text>
                </Flex>
              </MenuButton>
              <MenuList>
                <MenuItem as={RouterLink} to="/profile">
                  My Profile
                </MenuItem>
                <MenuItem as={RouterLink} to="/settings">
                  Settings
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  Sign Out
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <>
              <Button
                as={RouterLink}
                fontSize={'sm'}
                fontWeight={400}
                variant={'link'}
                to={'/login'}
              >
                Sign In
              </Button>
              <Button
                as={RouterLink}
                display={{ base: 'none', md: 'inline-flex' }}
                fontSize={'sm'}
                fontWeight={600}
                color={'white'}
                bg={'blue.500'}
                to={'/register'}
                _hover={{
                  bg: 'blue.400',
                }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Stack>
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <MobileNav isAuthenticated={isAuthenticated} handleLogout={handleLogout} />
      </Collapse>
    </Box>
  );
};

const DesktopNav = ({ isAuthenticated, currentPath }) => {
  const linkColor = useColorModeValue('gray.600', 'gray.200');
  const linkHoverColor = useColorModeValue('gray.800', 'white');
  const popoverContentBgColor = useColorModeValue('white', 'gray.800');

  // Navigation items based on authentication status
  const NAV_ITEMS = isAuthenticated
    ? [
        {
          label: 'Dashboard',
          href: '/dashboard',
        },
        {
          label: 'Documents',
          href: '/documents',
          children: [
            {
              label: 'All Documents',
              subLabel: 'View all your documents',
              href: '/documents',
            },
            {
              label: 'Shared With Me',
              subLabel: 'Documents shared by others',
              href: '/documents/shared',
            },
            {
              label: 'Upload',
              subLabel: 'Upload a new document',
              href: '/documents/upload',
            },
          ],
        },
      ]
    : [
        {
          label: 'Features',
          href: '/features',
        },
        {
          label: 'Pricing',
          href: '/pricing',
        },
      ];

  return (
    <Stack direction={'row'} spacing={4}>
      {NAV_ITEMS.map((navItem) => (
        <Box key={navItem.label}>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <Link
                p={2}
                as={RouterLink}
                to={navItem.href ?? '#'}
                fontSize={'sm'}
                fontWeight={500}
                color={currentPath === navItem.href ? 'blue.500' : linkColor}
                _hover={{
                  textDecoration: 'none',
                  color: linkHoverColor,
                }}
              >
                {navItem.label}
                {navItem.children && (
                  <Icon 
                    as={ChevronDownIcon} 
                    h={4} 
                    w={4} 
                    ml={1} 
                    transition={'all .25s ease-in-out'}
                  />
                )}
              </Link>
            </PopoverTrigger>

            {navItem.children && (
              <PopoverContent
                border={0}
                boxShadow={'xl'}
                bg={popoverContentBgColor}
                p={4}
                rounded={'xl'}
                minW={'sm'}
              >
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </Popover>
        </Box>
      ))}
    </Stack>
  );
};

const DesktopSubNav = ({ label, href, subLabel }) => {
  const bgHover = useColorModeValue('blue.50', 'gray.900');
  return (
    <Link
      as={RouterLink}
      to={href}
      role={'group'}
      display={'block'}
      p={2}
      rounded={'md'}
      _hover={{ bg: bgHover }}
    >
      <Stack direction={'row'} align={'center'}>
        <Box>
          <Text
            transition={'all .3s ease'}
            _groupHover={{ color: 'blue.500' }}
            fontWeight={500}
          >
            {label}
          </Text>
          <Text fontSize={'sm'}>{subLabel}</Text>
        </Box>
        <Flex
          transition={'all .3s ease'}
          transform={'translateX(-10px)'}
          opacity={0}
          _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
          justify={'flex-end'}
          align={'center'}
          flex={1}
        >
          <Icon color={'blue.500'} w={5} h={5} as={ChevronRightIcon} />
        </Flex>
      </Stack>
    </Link>
  );
};

const MobileNav = ({ isAuthenticated, handleLogout }) => {
  // Mobile navigation items based on authentication status
  const NAV_ITEMS = isAuthenticated
    ? [
        {
          label: 'Dashboard',
          href: '/dashboard',
        },
        {
          label: 'All Documents',
          href: '/documents',
        },
        {
          label: 'Shared With Me',
          href: '/documents/shared',
        },
        {
          label: 'Upload Document',
          href: '/documents/upload',
        },
        {
          label: 'My Profile',
          href: '/profile',
        },
        {
          label: 'Settings',
          href: '/settings',
        },
        {
          label: 'Sign Out',
          onClick: handleLogout,
        },
      ]
    : [
        {
          label: 'Features',
          href: '/features',
        },
        {
          label: 'Pricing',
          href: '/pricing',
        },
        {
          label: 'Sign In',
          href: '/login',
        },
        {
          label: 'Sign Up',
          href: '/register',
        },
      ];

  return (
    <Stack
      bg={useColorModeValue('white', 'gray.800')}
      p={4}
      display={{ md: 'none' }}
    >
      {NAV_ITEMS.map((navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} />
      ))}
    </Stack>
  );
};

const MobileNavItem = ({ label, children, href, onClick }) => {
  const { isOpen, onToggle } = useDisclosure();
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Stack spacing={4} onClick={children && onToggle}>
      {onClick ? (
        <Box
          py={2}
          as="button"
          onClick={onClick}
          justifyContent="space-between"
          alignItems="center"
          _hover={{
            textDecoration: 'none',
          }}
        >
          <Text
            fontWeight={600}
            color={textColor}
          >
            {label}
          </Text>
        </Box>
      ) : (
        <Link
          as={RouterLink}
          to={href ?? '#'}
          py={2}
          justifyContent="space-between"
          alignItems="center"
          _hover={{
            textDecoration: 'none',
          }}
        >
          <Text
            fontWeight={600}
            color={textColor}
          >
            {label}
          </Text>
          {children && (
            <Icon
              as={ChevronDownIcon}
              transition={'all .25s ease-in-out'}
              transform={isOpen ? 'rotate(180deg)' : ''}
              w={6}
              h={6}
            />
          )}
        </Link>
      )}

      <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
        <Stack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={'solid'}
          borderColor={borderColor}
          align={'start'}
        >
          {children &&
            children.map((child) => (
              <Link
                key={child.label}
                as={RouterLink}
                to={child.href}
                py={2}
              >
                {child.label}
              </Link>
            ))}
        </Stack>
      </Collapse>
    </Stack>
  );
};

export default Navbar;